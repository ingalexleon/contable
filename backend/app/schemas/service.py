from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.service import PeriodType


class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    default_price: float
    category: Optional[str] = None


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_price: Optional[float] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class ServiceResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    default_price: float
    category: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class ClientServiceCreate(BaseModel):
    client_id: int
    service_id: int
    custom_price: Optional[float] = None
    period: PeriodType = PeriodType.MONTHLY
    start_date: Optional[date] = None


class ClientServiceUpdate(BaseModel):
    custom_price: Optional[float] = None
    is_active: Optional[bool] = None
    period: Optional[PeriodType] = None
    start_date: Optional[date] = None


class ClientServiceResponse(BaseModel):
    id: int
    client_id: int
    service_id: int
    custom_price: Optional[float] = None
    is_active: bool
    period: PeriodType
    start_date: Optional[date] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
