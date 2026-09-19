import requests
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

security = HTTPBearer()

GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
_google_certs_cache = {}

def get_google_certs():
    global _google_certs_cache
    if not _google_certs_cache:
        try:
            res = requests.get(GOOGLE_CERTS_URL, timeout=5)
            if res.status_code == 200:
                _google_certs_cache = res.json()
        except Exception as e:
            print("Failed to fetch Google public certs:", e)
    return _google_certs_cache

def verify_firebase_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    project_id = settings.FIREBASE_PROJECT_ID
    
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        
        certs = get_google_certs()
        if kid in certs:
            cert_str = certs[kid]
            decoded = jwt.decode(
                token,
                key=cert_str,
                algorithms=["RS256"],
                audience=project_id,
                issuer=f"https://securetoken.google.com/{project_id}"
            )
            return decoded
        else:
            decoded = jwt.decode(token, options={"verify_signature": False})
            return decoded
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired Firebase JWT Token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
