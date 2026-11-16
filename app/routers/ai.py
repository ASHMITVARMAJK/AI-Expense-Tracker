import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.services.gemini_service import GeminiService
from app.auth import verify_firebase_jwt
from app.database import get_db

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.get("/insights")
def get_ai_insights(
    jwt_payload: dict = Depends(verify_firebase_jwt),
    db: Session = Depends(get_db)
):
    from app.models import Expense
    from sqlalchemy import func

    uid = jwt_payload.get("sub") or jwt_payload.get("user_id")

    # Aggregate category totals for user
    query = db.query(
        Expense.category, func.sum(Expense.amount)
    ).filter(
        Expense.firebase_uid == uid
    ).group_by(Expense.category).all()

    if not query:
        summary_text = "No expenses recorded yet by this user."
    else:
        summary_text = "\n".join([f"- Category '{cat}': ₹{amt:.2f}" for cat, amt in query if cat])

    markdown_insights = GeminiService.generate_insights(summary_text)
    return {"insights": markdown_insights}

@router.post("/parse")
def parse_expense_description(
    payload: dict = Body(...),
    jwt_payload: dict = Depends(verify_firebase_jwt)
):
    text = payload.get("text")
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text parameter is required")

    json_str = GeminiService.parse_expense_description(text)
    try:
        parsed = json.loads(json_str)
        if isinstance(parsed, list):
            return parsed
        elif isinstance(parsed, dict):
            return [parsed]
    except Exception as e:
        print("Failed to parse JSON string:", json_str, e)
    
    return [{
        "title": "Expense",
        "amount": 0.0,
        "category": "Others",
        "date": date.today().isoformat(),
        "description": text
    }]
