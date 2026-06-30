from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.client import ClientType


class ClientCreate(BaseModel):
    business_name: str
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    rfc: Optional[str] = None
    client_type: ClientType
    address: Optional[str] = None


class ClientUpdate(BaseModel):
    business_name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    rfc: Optional[str] = None
    client_type: Optional[ClientType] = None
    address: Optional[str] = None


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
