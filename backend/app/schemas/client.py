from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re
from datetime import datetime
from app.models.client import ClientType

RFC_REGEX = re.compile(r'^[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}$', re.IGNORECASE)
PHONE_REGEX = re.compile(r'^\d{10}$')


class ClientCreate(BaseModel):
    business_name: str
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: str
    rfc: str
    client_type: ClientType
    address: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not PHONE_REGEX.match(v):
            raise ValueError('El telefono debe tener exactamente 10 digitos')
        return v

    @field_validator('rfc')
    @classmethod
    def validate_rfc(cls, v: str) -> str:
        if not RFC_REGEX.match(v):
            raise ValueError('El RFC debe tener el formato correcto (ej. XAXX010101000 para persona fisica o XXX010101000 para persona moral)')
        return v


class ClientUpdate(BaseModel):
    business_name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    rfc: Optional[str] = None
    client_type: Optional[ClientType] = None
    address: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not PHONE_REGEX.match(v):
            raise ValueError('El telefono debe tener exactamente 10 digitos')
        return v

    @field_validator('rfc')
    @classmethod
    def validate_rfc(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not RFC_REGEX.match(v):
            raise ValueError('El RFC debe tener el formato correcto (ej. XAXX010101000 para persona fisica o XXX010101000 para persona moral)')
        return v


class ClientResponse(BaseModel):
    id: int
    business_name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    rfc: Optional[str] = None
    client_type: ClientType
    address: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None

    model_config = {"from_attributes": True}
