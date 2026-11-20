from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.deps import get_db, get_current_user
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_reset_token,
)
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    UserResponse,
    UserUpdate,
    TokenResponse,
)

router = APIRouter(tags=["Authentication"])


def _build_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        push_token=user.push_token,
        created_at=user.created_at,
    )


@router.post(
    "/auth/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def register(
    payload: UserRegister,
    db: Session = Depends(get_db),
):
    """Register a new user with email and/or phone number and password."""
    if payload.email:
        existing_email = db.query(User).filter(User.email == payload.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists.",
            )

    if payload.phone:
        existing_phone = db.query(User).filter(User.phone == payload.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this phone number already exists.",
            )

    hashed_pw = hash_password(payload.password)
    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hashed_pw,
        role=payload.role or "user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "name": user.name}
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=_build_user_response(user),
    )


@router.post(
    "/auth/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate and receive a JWT access token",
)
@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def login(
    payload: UserLogin,
    db: Session = Depends(get_db),
):
    """Authenticate via email or phone and password."""
    ident = payload.identifier
    user = (
        db.query(User)
        .filter(or_(User.email == ident, User.phone == ident))
        .first()
    )

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "name": user.name}
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=_build_user_response(user),
    )


@router.post(
    "/auth/forgot-password",
    response_model=ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Request a password reset token",
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Generate a password reset token for an account."""
    ident = payload.identifier
    user = (
        db.query(User)
        .filter(or_(User.email == ident, User.phone == ident))
        .first()
    )

    if not user:
        return ForgotPasswordResponse(
            message="If an account matches that identifier, password reset instructions have been issued.",
            reset_token=None,
        )

    token = generate_reset_token()
    user.reset_token = token
    user.reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    return ForgotPasswordResponse(
        message="If an account matches that identifier, password reset instructions have been issued.",
        reset_token=token,
    )


@router.post(
    "/auth/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Reset password using a valid reset token",
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Reset account password using the provided reset token."""
    user = db.query(User).filter(User.reset_token == payload.reset_token).first()

    if not user or not user.reset_token_expires_at or user.reset_token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    user.password_hash = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()

    return {"message": "Password successfully reset. You may now log in with your new password."}


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
)
@router.get(
    "/auth/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """Retrieve the currently logged-in user profile."""
    return _build_user_response(current_user)


@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current authenticated user profile",
)
@router.put(
    "/auth/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile fields for the currently logged-in user."""
    if payload.email is not None and payload.email != current_user.email:
        duplicate = db.query(User).filter(User.email == payload.email, User.id != current_user.id).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="That email address is already in use.",
            )
        current_user.email = payload.email

    if payload.phone is not None and payload.phone != current_user.phone:
        duplicate = db.query(User).filter(User.phone == payload.phone, User.id != current_user.id).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="That phone number is already in use.",
            )
        current_user.phone = payload.phone

    if payload.name is not None:
        current_user.name = payload.name

    if payload.push_token is not None:
        current_user.push_token = payload.push_token

    db.commit()
    db.refresh(current_user)
    return _build_user_response(current_user)

