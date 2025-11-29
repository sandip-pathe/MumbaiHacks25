"""
Authentication service with password hashing and session management
"""
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import jwt, JWTError
from loguru import logger

from app.database import db

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = secrets.token_urlsafe(32)  # In production, load from env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


class AuthService:
    """Handles user authentication, registration, and session management"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
        
        to_encode = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow()
        }
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[str]:
        """Verify JWT token and return user_id"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            return user_id
        except JWTError:
            return None
    
    @staticmethod
    async def create_user(
        email: str,
        password: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        company_name: Optional[str] = None,
        company_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new user account"""
        async with db.acquire() as conn:
            # Check if email already exists
            existing = await conn.fetchrow(
                "SELECT user_id FROM users WHERE email = $1",
                email
            )
            if existing:
                raise ValueError("Email already registered")
            
            # Hash password
            password_hash = AuthService.hash_password(password)
            
            # Create user
            user_id = f"user_{secrets.token_urlsafe(16)}"
            user = await conn.fetchrow(
                """
                INSERT INTO users (
                    user_id, email, password_hash, first_name, last_name,
                    company_name, company_type, is_active, email_verified
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, true, false)
                RETURNING user_id, email, first_name, last_name, company_name, created_at
                """,
                user_id, email, password_hash, first_name, last_name,
                company_name, company_type
            )
            
            logger.info(f"Created new user: {email}")
            return dict(user)
    
    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with email and password"""
        async with db.acquire() as conn:
            user = await conn.fetchrow(
                """
                SELECT user_id, email, password_hash, first_name, last_name,
                       is_active, email_verified
                FROM users
                WHERE email = $1
                """,
                email
            )
            
            if not user:
                return None
            
            if not user['is_active']:
                raise ValueError("Account is inactive")
            
            # Verify password
            if not AuthService.verify_password(password, user['password_hash']):
                return None
            
            # Update last login
            await conn.execute(
                "UPDATE users SET last_login_at = NOW() WHERE user_id = $1",
                user['user_id']
            )
            
            logger.info(f"User authenticated: {email}")
            return {
                "user_id": user['user_id'],
                "email": user['email'],
                "first_name": user['first_name'],
                "last_name": user['last_name'],
                "email_verified": user['email_verified']
            }
    
    @staticmethod
    async def create_session(
        user_id: str,
        token: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> str:
        """Create a new session for the user"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
        
        async with db.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_address)
                VALUES ($1, $2, $3, $4, $5)
                """,
                user_id, token_hash, expires_at, user_agent, ip_address
            )
        
        return token
    
    @staticmethod
    async def verify_session(token: str) -> Optional[str]:
        """Verify if session is valid and return user_id"""
        user_id = AuthService.verify_token(token)
        if not user_id:
            return None
        
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        async with db.acquire() as conn:
            session = await conn.fetchrow(
                """
                SELECT user_id FROM sessions
                WHERE token_hash = $1 AND expires_at > NOW()
                """,
                token_hash
            )
            
            if session:
                # Update last used
                await conn.execute(
                    "UPDATE sessions SET last_used_at = NOW() WHERE token_hash = $1",
                    token_hash
                )
                return session['user_id']
        
        return None
    
    @staticmethod
    async def invalidate_session(token: str):
        """Invalidate a session (logout)"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        async with db.acquire() as conn:
            await conn.execute(
                "DELETE FROM sessions WHERE token_hash = $1",
                token_hash
            )
    
    @staticmethod
    async def get_user(user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        async with db.acquire() as conn:
            user = await conn.fetchrow(
                """
                SELECT user_id, email, first_name, last_name, company_name,
                       company_type, avatar_url, created_at, last_login_at,
                       email_verified, is_active
                FROM users
                WHERE user_id = $1
                """,
                user_id
            )
            return dict(user) if user else None
    
    @staticmethod
    async def store_oauth_connection(
        user_id: str,
        provider: str,
        access_token: str,
        refresh_token: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        provider_user_id: Optional[str] = None,
        provider_username: Optional[str] = None,
        scopes: Optional[list] = None,
        metadata: Optional[dict] = None
    ):
        """Store OAuth connection for a user"""
        async with db.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO oauth_connections (
                    user_id, provider, access_token, refresh_token, token_expires_at,
                    provider_user_id, provider_username, scopes, metadata
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (user_id, provider) DO UPDATE SET
                    access_token = EXCLUDED.access_token,
                    refresh_token = EXCLUDED.refresh_token,
                    token_expires_at = EXCLUDED.token_expires_at,
                    provider_user_id = EXCLUDED.provider_user_id,
                    provider_username = EXCLUDED.provider_username,
                    scopes = EXCLUDED.scopes,
                    metadata = EXCLUDED.metadata,
                    updated_at = NOW()
                """,
                user_id, provider, access_token, refresh_token, expires_at,
                provider_user_id, provider_username, scopes or [], metadata or {}
            )
        logger.info(f"Stored {provider} OAuth connection for user {user_id}")
    
    @staticmethod
    async def get_oauth_connection(user_id: str, provider: str) -> Optional[Dict[str, Any]]:
        """Get OAuth connection for a user and provider"""
        async with db.acquire() as conn:
            conn_data = await conn.fetchrow(
                """
                SELECT * FROM oauth_connections
                WHERE user_id = $1 AND provider = $2
                """,
                user_id, provider
            )
            return dict(conn_data) if conn_data else None
    
    @staticmethod
    async def delete_oauth_connection(user_id: str, provider: str):
        """Delete OAuth connection"""
        async with db.acquire() as conn:
            await conn.execute(
                "DELETE FROM oauth_connections WHERE user_id = $1 AND provider = $2",
                user_id, provider
            )
        logger.info(f"Deleted {provider} OAuth connection for user {user_id}")


auth_service = AuthService()
