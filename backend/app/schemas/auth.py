from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator, ConfigDict


class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of the user")
    email: Optional[str] = Field(None, max_length=255, description="Email address")
    phone: Optional[str] = Field(None, max_length=32, description="Phone number")
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 characters)")
    role: Optional[str] = Field("user", max_length=64, description="User role, e.g. user, police, operator")

    @model_validator(mode="after")
    def validate_identifier(self):
        if not self.email and not self.phone:
            raise ValueError("At least one of email or phone must be provided for registration.")
        if self.email:
            self.email = self.email.strip().lower()
        if self.phone:
            self.phone = self.phone.strip()
        self.name = self.name.strip()
        return self


class UserLogin(BaseModel):
    identifier: Optional[str] = Field(None, description="Email or phone number")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    password: str = Field(..., min_length=1, description="Password")

    @model_validator(mode="after")
    def resolve_identifier(self):
        if not self.identifier:
            if self.email:
                self.identifier = self.email.strip().lower()
            elif self.phone:
                self.identifier = self.phone.strip()
            else:
                raise ValueError("Must provide identifier, email, or phone.")
        else:
            self.identifier = self.identifier.strip()
            if "@" in self.identifier:
                self.identifier = self.identifier.lower()
        return self


class ForgotPasswordRequest(BaseModel):
    email: Optional[str] = Field(None, description="Registered email address")
    phone: Optional[str] = Field(None, description="Registered phone number")
    identifier: Optional[str] = Field(None, description="Email or phone number")

    @model_validator(mode="after")
    def resolve_identifier(self):
        if not self.identifier:
            if self.email:
                self.identifier = self.email.strip().lower()
            elif self.phone:
                self.identifier = self.phone.strip()
            else:
                raise ValueError("Must provide email, phone, or identifier.")
        else:
            self.identifier = self.identifier.strip()
            if "@" in self.identifier:
                self.identifier = self.identifier.lower()
        return self


class ForgotPasswordResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    reset_token: str = Field(..., min_length=1, description="Password reset token")
    new_password: str = Field(..., min_length=6, max_length=128, description="New password")


class UserResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    push_token: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=32)
    push_token: Optional[str] = Field(None, max_length=512)

    @model_validator(mode="after")
    def clean_fields(self):
        if self.email:
            self.email = self.email.strip().lower()
        if self.phone:
            self.phone = self.phone.strip()
        if self.name:
            self.name = self.name.strip()
        return self


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
