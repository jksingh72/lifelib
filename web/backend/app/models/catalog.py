from pydantic import BaseModel

class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    path: str
    is_active: bool = False

class SelectModelRequest(BaseModel):
    model_id: str

