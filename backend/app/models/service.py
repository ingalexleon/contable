import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey, Date, UniqueConstraint
from datetime import datetime

from app.core.database import Base


class PeriodType(str, enum.Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    default_price = Column(Float, nullable=False)
    category = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)


class ClientService(Base):
    __tablename__ = "client_services"
    __table_args__ = (
        UniqueConstraint("client_id", "service_id", name="uq_client_service"),
    )

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    custom_price = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    period = Column(Enum(PeriodType), default=PeriodType.MONTHLY)
    start_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
