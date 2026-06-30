from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.payment import PaymentStatus


class PaymentCreate(BaseModel):
    client_id: int
    amount: float
    payment_date: Optional[date] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    status: PaymentStatus = PaymentStatus.PENDING
    notes: Optional[str] = None


class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_date: Optional[date] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    status: Optional[PaymentStatus] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    client_id: int
    amount: float
    payment_date: Optional[date] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    status: PaymentStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PaymentProofResponse(BaseModel):
    id: int
    payment_id: int
    file_path: str
    file_type: Optional[str] = None
    uploaded_at: datetime
    uploaded_by: Optional[int] = None

    model_config = {"from_attributes": True}
