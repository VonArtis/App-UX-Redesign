# Investment model definitions
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class Investment(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    amount: float
    rate: float
    term: int  # in months
    status: Literal['active', 'pending', 'completed'] = 'active'
    created_at: Optional[str] = None

class InvestmentPlan(BaseModel):
    name: str
    rate: float
    term: int
    minimum_amount: float
    description: Optional[str] = None

class InvestmentRequest(BaseModel):
    name: str
    amount: float
    rate: float
    term: int