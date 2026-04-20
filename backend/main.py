from typing import Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from correlation_engine import SpendingMindAnalyzer
from mood_detector import detect_emotion

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = SpendingMindAnalyzer()

# Models
class EmotionRequest(BaseModel):
    text: str

class Transaction(BaseModel):
    amount: float = Field(gt=0)
    description: Optional[str] = ""
    category: Optional[str] = ""
    date: str


class AnalyzeRequest(BaseModel):
    transactions: Optional[List[Transaction]] = None


transactions_db: List[Dict] = []

@app.post("/classify-emotion/")
async def classify_emotion(request: EmotionRequest):
    return detect_emotion(request.text)

@app.post("/track-transaction/")
async def track_transaction(transaction: Transaction):
    txn = transaction.model_dump()
    transactions_db.append(txn)
    return {
        "message": "Transaction tracked successfully",
        "transaction": txn,
        "total_transactions": len(transactions_db),
    }


@app.post("/transactions/")
async def add_transaction(transaction: Transaction):
    return await track_transaction(transaction)


@app.get("/transactions/")
async def list_transactions():
    return {"transactions": transactions_db, "count": len(transactions_db)}


@app.post("/analyze-spending/")
async def analyze_spending(payload: AnalyzeRequest):
    source = [item.model_dump() for item in payload.transactions] if payload.transactions else transactions_db
    return analyzer.analyze(source)


@app.get("/correlation/")
async def get_correlation():
    # Kept for backward compatibility with existing frontend route naming.
    return analyzer.analyze(transactions_db)

# To run the app: Uncomment the following line when running locally
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)