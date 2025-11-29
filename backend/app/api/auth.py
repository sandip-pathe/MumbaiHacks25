"""
Authentication API endpoints
"""
import os
import requests
from fastapi import APIRouter, HTTPException, Request, Body, Query, Header, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from loguru import logger

from app.config import get_settings
from app.services.auth_service import auth_service

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["auth"])


# --- Pydantic Models ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    company_type: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    user_id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    company_name: Optional[str]
    email_verified: bool


# --- Helper Functions ---
async def get_current_user(authorization: str = Header(None)) -> str:
    """Dependency to get current user from token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    user_id = await auth_service.verify_session(token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return user_id


# --- Auth Endpoints ---
@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, request: Request):
    """Register a new user with email and password"""
    try:
        # Create user
        user = await auth_service.create_user(
            email=user_data.email,
            password=user_data.password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            company_name=user_data.company_name,
            company_type=user_data.company_type
        )
        
        # Create access token
        access_token = auth_service.create_access_token(user['user_id'])
        
        # Create session
        user_agent = request.headers.get("user-agent")
        ip_address = request.client.host if request.client else None
        await auth_service.create_session(
            user['user_id'],
            access_token,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        logger.info(f"User registered: {user_data.email}")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user['user_id'],
                "user_id": user['user_id'],
                "email": user['email'],
                "first_name": user['first_name'],
                "last_name": user['last_name']
            }
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, request: Request):
    """Login with email and password"""
    try:
        # Authenticate user
        user = await auth_service.authenticate_user(
            credentials.email,
            credentials.password
        )
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create access token
        access_token = auth_service.create_access_token(user['user_id'])
        
        # Create session
        user_agent = request.headers.get("user-agent")
        ip_address = request.client.host if request.client else None
        await auth_service.create_session(
            user['user_id'],
            access_token,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        logger.info(f"User logged in: {credentials.email}")
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user['user_id'],
                "user_id": user['user_id'],
                "email": user['email'],
                "first_name": user.get('first_name'),
                "last_name": user.get('last_name')
            }
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/logout")
async def logout(authorization: str = Header(None)):
    """Logout and invalidate session"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = authorization.replace("Bearer ", "")
    await auth_service.invalidate_session(token)
    
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    """Get current user information"""
    user = await auth_service.get_user(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(**user)


# --- GitHub OAuth Integration ---
@router.get("/github/callback")
async def github_oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    user_id: str = Depends(get_current_user)
):
    """
    Handle GitHub OAuth callback and link to authenticated user
    """
    try:
        settings = get_settings()
        
        # Exchange code for access token
        token_url = "https://github.com/login/oauth/access_token"
        headers = {"Accept": "application/json"}
        data = {
            "client_id": settings.github_oauth_client_id,
            "client_secret": settings.github_oauth_client_secret,
            "code": code,
        }
        
        resp = requests.post(token_url, headers=headers, data=data)
        if not resp.ok:
            raise HTTPException(status_code=400, detail="Failed to exchange GitHub code")
        
        token_data = resp.json()
        
        if "error" in token_data:
            raise HTTPException(status_code=400, detail=token_data.get('error_description', 'GitHub OAuth error'))
        
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token from GitHub")
        
        # Get GitHub user info
        user_resp = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if not user_resp.ok:
            raise HTTPException(status_code=400, detail="Failed to get GitHub user info")
        
        github_user = user_resp.json()
        
        # Store OAuth connection
        await auth_service.store_oauth_connection(
            user_id=user_id,
            provider="github",
            access_token=access_token,
            provider_user_id=str(github_user.get('id')),
            provider_username=github_user.get('login'),
            scopes=token_data.get('scope', '').split(',') if token_data.get('scope') else [],
            metadata={
                "avatar_url": github_user.get('avatar_url'),
                "name": github_user.get('name'),
                "bio": github_user.get('bio'),
                "public_repos": github_user.get('public_repos')
            }
        )
        
        logger.info(f"GitHub connected for user {user_id}: {github_user.get('login')}")
        
        return {
            "success": True,
            "provider": "github",
            "username": github_user.get('login'),
            "access_token": access_token
        }
    
    except Exception as e:
        logger.error(f"GitHub OAuth callback error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/github/status")
async def get_github_status(user_id: str = Depends(get_current_user)):
    """Check if user has connected GitHub"""
    connection = await auth_service.get_oauth_connection(user_id, "github")
    
    if not connection:
        return {"connected": False}
    
    return {
        "connected": True,
        "username": connection.get('provider_username'),
        "connected_at": connection.get('created_at')
    }


@router.delete("/github/disconnect")
async def disconnect_github(user_id: str = Depends(get_current_user)):
    """Disconnect GitHub OAuth"""
    await auth_service.delete_oauth_connection(user_id, "github")
    return {"message": "GitHub disconnected successfully"}

@router.get("/github/callback")
def github_callback(code: str = Query(...), state: str = Query(None), redirect_uri: str = Query(None)):
    """
    Handles GitHub OAuth callback, exchanges code for access token.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    settings = get_settings()
    github_client_id = settings.github_oauth_client_id
    github_client_secret = settings.github_oauth_client_secret
    token_url = "https://github.com/login/oauth/access_token"
    headers = {"Accept": "application/json"}
    data = {
        "client_id": github_client_id,
        "client_secret": github_client_secret,
        "code": code,
    }
    # GitHub OAuth requires the redirect_uri to match what was used in authorization
    if redirect_uri:
        data["redirect_uri"] = redirect_uri
    
    logger.info(f"Exchanging GitHub code (length: {len(code)}) with redirect_uri: {redirect_uri}")
    
    resp = requests.post(token_url, headers=headers, data=data)
    if not resp.ok:
        logger.error(f"GitHub token exchange HTTP error: {resp.status_code} - {resp.text}")
        raise HTTPException(status_code=400, detail=f"GitHub token exchange failed: {resp.text}")
    
    token_data = resp.json()
    logger.info(f"GitHub token exchange response keys: {list(token_data.keys())}")
    
    # Check for error in response
    if "error" in token_data:
        error_msg = token_data.get('error_description', token_data.get('error'))
        logger.error(f"GitHub OAuth error: {error_msg}")
        raise HTTPException(status_code=400, detail=f"GitHub OAuth error: {error_msg}")
    
    access_token = token_data.get("access_token")
    if not access_token:
        logger.error(f"No access token in response: {token_data}")
        raise HTTPException(status_code=400, detail=f"No access token returned from GitHub. Response: {token_data}")
    
    # Fetch user info
    user_resp = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"token {access_token}"}
    )
    if not user_resp.ok:
        logger.error(f"Failed to fetch GitHub user: {user_resp.status_code} - {user_resp.text}")
        raise HTTPException(status_code=400, detail="Failed to fetch GitHub user info")
    user_data = user_resp.json()
    logger.info(f"Successfully authenticated GitHub user: {user_data.get('login')}")
    return {"access_token": access_token, "user": user_data}

def neon_query(sql: str, params=None):
    headers = {"Authorization": f"Bearer {NEON_API_KEY}", "Content-Type": "application/json"}
    payload = {"sql": sql}
    if params:
        payload["params"] = params
    resp = requests.post(f"{NEON_DATA_API_URL}/sql", json=payload, headers=headers)
    if not resp.ok:
        raise HTTPException(status_code=500, detail=f"Neon API error: {resp.text}")
    return resp.json()

def issue_stack_auth_token(user_id: str):
    # TODO: Integrate with Stack Auth API to issue JWT
    # For now, return a dummy token
    return jwt.encode({"sub": user_id}, "dummy_secret", algorithm="HS256")

def verify_stack_auth_token(token: str):
    # TODO: Validate JWT using Stack Auth JWKS
    # For now, decode with dummy secret
    try:
        payload = jwt.decode(token, "dummy_secret", algorithms=["HS256"])
        return payload.get("sub")
    except Exception:
        return None

