import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.config import settings
from app.core.database import get_db
from app.models.payment import Payment, PaymentProof
from app.models.user import User
from app.schemas.payment import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentProofResponse,
)
from app.dependencies import get_current_user, require_admin
from app.middleware.audit import log_audit

router = APIRouter(prefix="/payments", tags=["payments"])


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, considering forwarded headers."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _build_proof_response(proof: PaymentProof) -> dict:
    """Build a PaymentProofResponse dict with download_url instead of file_path."""
    return {
        "id": proof.id,
        "payment_id": proof.payment_id,
        "download_url": f"/api/payments/proofs/{proof.id}/download",
        "file_type": proof.file_type,
        "uploaded_at": proof.uploaded_at,
        "uploaded_by": proof.uploaded_by,
    }


@router.get("/", response_model=List[PaymentResponse])
async def list_payments(
    client_id: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Payment)
    if client_id:
        query = query.where(Payment.client_id == client_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/", response_model=PaymentResponse)
async def create_payment(
    data: PaymentCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    payment = Payment(**data.model_dump())
    db.add(payment)
    await db.flush()
    await db.refresh(payment)

    await log_audit(
        db, admin.id, "create", "payment", payment.id,
        new_values=data.model_dump(mode="json"),
        ip_address=_get_client_ip(request),
    )
    return payment


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(payment, key, value)
    await db.flush()
    await db.refresh(payment)

    await log_audit(
        db, admin.id, "update", "payment", payment.id,
        new_values=update_data,
        ip_address=_get_client_ip(request),
    )
    return payment


@router.delete("/{payment_id}", response_model=PaymentResponse)
async def delete_payment(
    payment_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    await db.delete(payment)
    await db.flush()

    await log_audit(
        db, admin.id, "delete", "payment", payment_id,
        ip_address=_get_client_ip(request),
    )
    return payment


@router.post("/{payment_id}/proof", response_model=PaymentProofResponse)
async def upload_payment_proof(
    payment_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # Verify payment exists
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Accepted: PDF, JPEG, PNG",
        )

    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "bin"
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    with open(file_path, "wb") as f:
        f.write(content)

    proof = PaymentProof(
        payment_id=payment_id,
        file_path=file_path,
        file_type=file.content_type,
        uploaded_by=current_user.id,
    )
    db.add(proof)
    await db.flush()
    await db.refresh(proof)

    await log_audit(
        db, current_user.id, "create", "payment_proof", proof.id,
        new_values={"payment_id": payment_id, "filename": filename},
        ip_address=_get_client_ip(request),
    )
    return _build_proof_response(proof)


@router.get("/{payment_id}/proofs", response_model=List[PaymentProofResponse])
async def list_payment_proofs(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PaymentProof).where(PaymentProof.payment_id == payment_id)
    )
    proofs = result.scalars().all()
    return [_build_proof_response(proof) for proof in proofs]


@router.get("/proofs/{proof_id}/download")
async def download_payment_proof(
    proof_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a payment proof file by its ID."""
    result = await db.execute(
        select(PaymentProof).where(PaymentProof.id == proof_id)
    )
    proof = result.scalar_one_or_none()
    if not proof:
        raise HTTPException(status_code=404, detail="Payment proof not found")

    if not os.path.exists(proof.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    filename = os.path.basename(proof.file_path)
    return FileResponse(
        path=proof.file_path,
        media_type=proof.file_type or "application/octet-stream",
        filename=filename,
    )
