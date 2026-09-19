import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Body
from app.services.gemini_service import GeminiService
from app.auth import verify_firebase_jwt

router = APIRouter(prefix="/api/ai", tags=["AI"])

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
