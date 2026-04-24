from datetime import datetime, timezone
import os
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.correlation_engine import SpendingMindAnalyzer
from backend.database import MoodEntry, SessionLocal, Transaction as DBTransaction, init_db
from backend.mood_detector import detect_emotion

app = FastAPI()
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = SpendingMindAnalyzer()
init_db()


def get_db() -> Session:
    db = SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise


def _parse_iso_datetime(value: Optional[str]) -> datetime:
    if not value:
        return datetime.now(timezone.utc)

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Invalid datetime format. Use ISO-8601.") from exc

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _find_nearest_mood_entry(
    db: Session,
    *,
    user_id: str,
    session_id: str,
    timestamp: datetime,
) -> Optional[MoodEntry]:
    moods = (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == user_id, MoodEntry.session_id == session_id)
        .order_by(MoodEntry.timestamp.desc())
        .limit(100)
        .all()
    )

    if not moods:
        return None

    return min(moods, key=lambda entry: abs((entry.timestamp - timestamp).total_seconds()))

# Models
class EmotionRequest(BaseModel):
    text: str
    user_id: Optional[str] = "anonymous"
    session_id: Optional[str] = "default"
    timestamp: Optional[str] = None

class Transaction(BaseModel):
    amount: float = Field(gt=0)
    description: Optional[str] = ""
    category: Optional[str] = ""
    date: str
    user_id: Optional[str] = "anonymous"
    session_id: Optional[str] = "default"


class AnalyzeRequest(BaseModel):
    transactions: Optional[List[Transaction]] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None

@app.post("/classify-emotion/")
async def classify_emotion(request: EmotionRequest):
    result = detect_emotion(request.text)
    db = get_db()
    try:
        mood = MoodEntry(
            user_id=request.user_id or "anonymous",
            session_id=request.session_id or "default",
            text=request.text,
            emotion=result["emotion"],
            score=float(result["score"]),
            timestamp=_parse_iso_datetime(request.timestamp),
        )
        db.add(mood)
        db.commit()
        db.refresh(mood)

        return {
            **result,
            "mood_entry_id": mood.id,
            "timestamp": mood.timestamp.isoformat(),
        }
    finally:
        db.close()

@app.post("/track-transaction/")
async def track_transaction(transaction: Transaction):
    db = get_db()
    try:
        txn_timestamp = _parse_iso_datetime(transaction.date)
        user_id = transaction.user_id or "anonymous"
        session_id = transaction.session_id or "default"
        mood = _find_nearest_mood_entry(
            db,
            user_id=user_id,
            session_id=session_id,
            timestamp=txn_timestamp,
        )

        db_txn = DBTransaction(
            user_id=user_id,
            session_id=session_id,
            amount=float(transaction.amount),
            description=transaction.description or "",
            category=(transaction.category or "").strip().lower(),
            timestamp=txn_timestamp,
            mood_entry_id=mood.id if mood else None,
        )
        db.add(db_txn)
        db.commit()
        db.refresh(db_txn)

        total_transactions = (
            db.query(DBTransaction)
            .filter(DBTransaction.user_id == user_id, DBTransaction.session_id == session_id)
            .count()
        )

        return {
            "message": "Transaction tracked successfully",
            "transaction": {
                "id": db_txn.id,
                "amount": db_txn.amount,
                "description": db_txn.description,
                "category": db_txn.category,
                "date": db_txn.timestamp.isoformat(),
                "user_id": db_txn.user_id,
                "session_id": db_txn.session_id,
                "mood_entry_id": db_txn.mood_entry_id,
            },
            "total_transactions": total_transactions,
        }
    finally:
        db.close()


@app.post("/transactions/")
async def add_transaction(transaction: Transaction):
    return await track_transaction(transaction)


@app.get("/transactions/")
async def list_transactions():
    db = get_db()
    try:
        rows = db.query(DBTransaction).order_by(DBTransaction.timestamp.asc()).all()
        transactions = [
            {
                "id": row.id,
                "amount": row.amount,
                "description": row.description,
                "category": row.category,
                "date": row.timestamp.isoformat(),
                "user_id": row.user_id,
                "session_id": row.session_id,
                "mood_entry_id": row.mood_entry_id,
            }
            for row in rows
        ]
        return {"transactions": transactions, "count": len(transactions)}
    finally:
        db.close()


@app.post("/analyze-spending/")
async def analyze_spending(payload: AnalyzeRequest):
    if payload.transactions:
        source = [item.model_dump() for item in payload.transactions]
        return analyzer.analyze(source)

    db = get_db()
    try:
        query = db.query(DBTransaction)
        if payload.user_id:
            query = query.filter(DBTransaction.user_id == payload.user_id)
        if payload.session_id:
            query = query.filter(DBTransaction.session_id == payload.session_id)

        rows = query.order_by(DBTransaction.timestamp.asc()).all()
        source = [
            {
                "amount": row.amount,
                "description": row.description,
                "category": row.category,
                "date": row.timestamp.isoformat(),
            }
            for row in rows
        ]
        return analyzer.analyze(source)
    finally:
        db.close()


@app.get("/correlation/")
async def get_correlation():
    db = get_db()
    try:
        rows = db.query(DBTransaction).order_by(DBTransaction.timestamp.asc()).all()
        source = [
            {
                "amount": row.amount,
                "description": row.description,
                "category": row.category,
                "date": row.timestamp.isoformat(),
            }
            for row in rows
        ]
        # Kept for backward compatibility with existing frontend route naming.
        return analyzer.analyze(source)
    finally:
        db.close()

# To run the app: Uncomment the following line when running locally
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)