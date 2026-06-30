from pydantic import BaseModel
from typing import Optional, Any


class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    permissions: Optional[Any] = None

    model_config = {"from_attributes": True}
