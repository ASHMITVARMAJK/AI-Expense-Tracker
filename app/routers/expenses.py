from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Expense
from app.schemas import ExpenseCreate, ExpenseResponse, DashboardSummaryResponse
from app.auth import verify_firebase_jwt

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

@router.post("", response_model=ExpenseResponse)
def create_expense(
    expense_in: ExpenseCreate,
    jwt_payload: dict = Depends(verify_firebase_jwt),
    db: Session = Depends(get_db)
):
    uid = jwt_payload.get("sub") or jwt_payload.get("user_id")
    expense = Expense(
        title=expense_in.title,
        amount=expense_in.amount,
        category=expense_in.category,
        date=expense_in.date,
        description=expense_in.description,
        firebase_uid=uid
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("", response_model=dict)
def get_expenses(
    category: Optional[str] = None,
    startDate: Optional[date] = None,
    endDate: Optional[date] = None,
    search: Optional[str] = None,
    page: int = Query(0, ge=0),
    size: int = Query(10, ge=1),
    sortBy: str = "date",
    direction: str = "desc",
    jwt_payload: dict = Depends(verify_firebase_jwt),
    db: Session = Depends(get_db)
):
    uid = jwt_payload.get("sub") or jwt_payload.get("user_id")
    query = db.query(Expense).filter(Expense.firebase_uid == uid)

    if category:
        query = query.filter(Expense.category == category)
    if startDate:
        query = query.filter(Expense.date >= startDate)
    if endDate:
        query = query.filter(Expense.date <= endDate)
    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            func.lower(Expense.title).like(search_pattern) | 
            func.lower(Expense.description).like(search_pattern)
        )

    total_elements = query.count()
    total_pages = (total_elements + size - 1) // size if total_elements > 0 else 0

    sort_column = getattr(Expense, sortBy, Expense.date)
    if direction.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    expenses = query.offset(page * size).limit(size).all()

    return {
        "content": [ExpenseResponse.model_validate(e) for e in expenses],
        "totalPages": total_pages,
        "totalElements": total_elements,
        "number": page,
        "size": size,
        "first": page == 0,
        "last": page >= total_pages - 1
    }


@router.get("/dashboard", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    jwt_payload: dict = Depends(verify_firebase_jwt),
    db: Session = Depends(get_db)
):
    uid = jwt_payload.get("sub") or jwt_payload.get("user_id")

    total_spend = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
        Expense.firebase_uid == uid
    ).scalar()

    today = date.today()
    first_day = today.replace(day=1)
    monthly_spend = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(
        Expense.firebase_uid == uid,
        Expense.date >= first_day,
        Expense.date <= today
    ).scalar()

    recent = db.query(Expense).filter(
        Expense.firebase_uid == uid
    ).order_by(Expense.date.desc(), Expense.id.desc()).limit(5).all()

    category_query = db.query(
        Expense.category, func.sum(Expense.amount)
    ).filter(
        Expense.firebase_uid == uid
    ).group_by(Expense.category).all()

    category_allocations = {cat: float(amt) for cat, amt in category_query if cat}

    return {
        "total_spend": float(total_spend),
        "monthly_spend": float(monthly_spend),
        "recent_expenses": [ExpenseResponse.model_validate(e) for e in recent],
        "category_allocations": category_allocations
    }


@router.get("/{id}", response_model=ExpenseResponse)
def get_expense_by_id(
    id: int,
    jwt_payload: dict = Depends(verify_firebase_jwt),
    db: Session = Depends(get_db)
):
    uid = jwt_payload.get("sub") or jwt_payload.get("user_id")
    expense = db.query(Expense).filter(Expense.id == id, Expense.firebase_uid == uid).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found or unauthorized")
    return expense


@router.put("/{id}", response_model=ExpenseResponse)
def update_expense(
    id: int,
    expense_in: ExpenseCreate,
    jwt_payload: dict = Depends(verify_firebase_jwt),
    db: Session = Depends(get_db)
):
    uid = jwt_payload.get("sub") or jwt_payload.get("user_id")
    expense = db.query(Expense).filter(Expense.id == id, Expense.firebase_uid == uid).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found or unauthorized")

    expense.title = expense_in.title
    expense.amount = expense_in.amount
    expense.category = expense_in.category
    expense.date = expense_in.date
    expense.description = expense_in.description

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    id: int,
    jwt_payload: dict = Depends(verify_firebase_jwt),
    db: Session = Depends(get_db)
):
    uid = jwt_payload.get("sub") or jwt_payload.get("user_id")
    expense = db.query(Expense).filter(Expense.id == id, Expense.firebase_uid == uid).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found or unauthorized")

    db.delete(expense)
    db.commit()
    return None
