from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserResponse
from app.auth import verify_firebase_jwt

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/sync", response_model=UserResponse)
def sync_user(jwt_payload: dict = Depends(verify_firebase_jwt), db: Session = Depends(get_db)):
    uid = jwt_payload.get("sub") or jwt_payload.get("user_id") or jwt_payload.get("uid")
    email = jwt_payload.get("email")
    name = jwt_payload.get("name")

    if not name and email:
        name = email.split("@")[0]

    user = db.query(User).filter(User.firebase_uid == uid).first()
    if not user:
        user = User(firebase_uid=uid, email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif email and user.email != email:
        user.email = email
        user.name = name
        db.commit()
        db.refresh(user)

    return user
