import os
import requests
from fastapi import APIRouter, HTTPException, Request, Body, Query
from pydantic import BaseModel, EmailStr
from jose import jwt

from app.config import get_settings
settings = get_settings()
NEON_DATA_API_URL = settings.neon_data_api_url
NEON_API_KEY = settings.neon_api_key
STACK_JWKS_URL = settings.stack_jwks_url

router = APIRouter(prefix="/auth", tags=["auth"])

# --- GitHub OAuth Authorization URL ---
@router.post("/github/authorize")
def github_authorize(redirect_uri: str = Body(...), state: str = Body(None)):
    """
    Returns the GitHub OAuth authorization URL for the frontend to redirect the user.
    """
    settings = get_settings()
    github_client_id = settings.github_oauth_client_id
    base_url = "https://github.com/login/oauth/authorize"
    params = {
        "client_id": github_client_id,
        "redirect_uri": redirect_uri,
        "state": state or "",
        "scope": "repo user"
    }
    from urllib.parse import urlencode
    auth_url = f"{base_url}?{urlencode(params)}"
    return {"authorization_url": auth_url}

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- GitHub OAuth Callback ---
from fastapi import Query


from app.config import get_settings

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

@router.post("/signup", response_model=Token)
def signup(user: UserCreate):
    # Check if user exists
    sql = "SELECT user_id FROM users WHERE email = $1"
    result = neon_query(sql, [user.email])
    if result["results"]:
        raise HTTPException(status_code=400, detail="Email already registered")
    # Insert user
    user_id = user.email  # Use email as user_id for Stack Auth
    sql = "INSERT INTO users (user_id, email, password) VALUES ($1, $2, $3) RETURNING user_id"
    neon_query(sql, [user_id, user.email, user.password])
    token = issue_stack_auth_token(user_id)
    return Token(access_token=token)

@router.post("/login", response_model=Token)
def login(user: UserLogin):
    sql = "SELECT user_id, password FROM users WHERE email = $1"
    result = neon_query(sql, [user.email])
    if not result["results"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    db_user = result["results"][0]
    if db_user["password"] != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = issue_stack_auth_token(db_user["user_id"])
    return Token(access_token=token)

@router.get("/me")
def get_me(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user_id = verify_stack_auth_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    sql = "SELECT email FROM users WHERE user_id = $1"
    result = neon_query(sql, [user_id])
    if not result["results"]:
        raise HTTPException(status_code=404, detail="User not found")
    return {"email": result["results"][0]["email"]}
