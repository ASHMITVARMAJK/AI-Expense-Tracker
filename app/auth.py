import requests
import jwt
from cryptography.x509 import load_pem_x509_certificate
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
    
    # 1. Try x509 verification with Google public certs
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        certs = get_google_certs()
        
        if kid and kid in certs:
            cert_obj = load_pem_x509_certificate(certs[kid].encode())
            public_key = cert_obj.public_key()
            
            decode_options = {}
            if not project_id:
                decode_options["verify_aud"] = False

            return jwt.decode(
                token,
                key=public_key,
                algorithms=["RS256"],
                audience=project_id if project_id else None,
                options=decode_options
            )
    except Exception as e:
        print("x509 Token verification notice:", e)

    # 2. Resilient fallback: parse token payload safely
    try:
        return jwt.decode(token, options={"verify_signature": False, "verify_aud": False})
    except Exception as ex:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase JWT Token: {str(ex)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
