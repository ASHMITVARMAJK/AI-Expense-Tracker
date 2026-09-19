import json
import re
from datetime import date
import requests
from app.config import settings

class GeminiService:
    @staticmethod
    def parse_expense_description(text: str) -> str:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return GeminiService._get_mock_parsed_response(text)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        prompt = f"""
You are an expert financial assistant. Analyze the user's expense description and extract ALL expenses mentioned.
Return ONLY a valid JSON array of objects. Do not include markdown formatting, backticks, or extra text.

Today's date is: {date.today().isoformat()}

Each object in the JSON array must have:
- "title": concise string title for the expense item
- "amount": numeric value (e.g. 500.00)
- "category": choose ONE from ["Food", "Transport", "Utilities", "Entertainment", "Shopping", "Healthcare", "Education", "Others"]
- "date": string in YYYY-MM-DD format (if user says 'yesterday', calculate relative to today; default to today if unspecified)
- "description": original notes or context

User text: "{text}"
"""
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }

        try:
            res = requests.post(url, json=payload, timeout=10)
            if res.status_code == 200:
                data = res.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                return GeminiService._clean_json_response(raw_text)
            else:
                print("Gemini API error status:", res.status_code, res.text)
                return GeminiService._get_mock_parsed_response(text)
        except Exception as e:
            print("Gemini API call failed:", e)
            return GeminiService._get_mock_parsed_response(text)

    @staticmethod
    def _clean_json_response(raw_response: str) -> str:
        if not raw_response:
            return "[]"
        clean = raw_response.strip()
        if clean.startswith("```"):
            lines = clean.split("\n")
            if len(lines) > 2:
                clean = "\n".join(lines[1:-1])
            else:
                clean = clean.replace("```json", "").replace("```", "")
        return clean.strip()

    @staticmethod
    def _get_mock_parsed_response(text: str) -> str:
        title = "Expense"
        category = "Others"
        amount = 0.0
        lower = text.lower()

        if any(k in lower for k in ["groceries", "food", "dinner", "pizza"]):
            title, category = "Groceries/Food", "Food"
        elif any(k in lower for k in ["petrol", "cab", "uber", "transport"]):
            title, category = "Transport", "Transport"
        elif any(k in lower for k in ["bill", "rent", "electricity"]):
            title, category = "Utility Bill", "Utilities"
        elif any(k in lower for k in ["shoes", "shirt", "shopping"]):
            title, category = "Shopping", "Shopping"

        match = re.search(r'\d+', text)
        if match:
            amount = float(match.group())

        return json.dumps([{
            "title": title,
            "amount": amount,
            "category": category,
            "date": date.today().isoformat(),
            "description": f"Parsed locally: {text}"
        }])
