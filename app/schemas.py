from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class UserResponse(BaseModel):
    firebase_uid: str
    email: Optional[str] = None
    name: Optional[str] = None

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    date: date
    description: Optional[str] = ""


class ExpenseResponse(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    date: date
    description: Optional[str] = ""
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DashboardSummaryResponse(BaseModel):
    total_spend: float
    monthly_spend: float
    recent_expenses: List[ExpenseResponse]
    category_allocations: dict
