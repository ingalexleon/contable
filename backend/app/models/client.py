import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from datetime import datetime

from app.core.database import Base


class ClientType(str, enum.Enum):
    PERSONA_FISICA = "Persona Fisica"
    PERSONA_MORAL = "Persona Moral"
    REGIMEN_SIMPLIFICADO = "Regimen Simplificado"


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String(255), nullable=False, index=True)
    contact_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    rfc = Column(String(13), nullable=True, index=True)
    client_type = Column(Enum(ClientType), nullable=False)
    address = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)  # soft delete
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
