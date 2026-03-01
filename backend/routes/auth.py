from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from database import get_db, User
from auth import hash_password, verify_password, create_token, get_current_user
import uuid

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user = User(
        id=str(uuid.uuid4()),
        email=req.email,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.commit()

    token = create_token(user.id)
    return {"token": token, "email": user.email}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_token(user.id)
    return {"token": token, "email": user.email}


@router.get("/me")
def me(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"email": user.email, "id": user.id}
