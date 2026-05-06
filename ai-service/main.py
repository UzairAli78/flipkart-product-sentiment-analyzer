"""
main.py — FastAPI AI Sentiment Service

Endpoints:
  GET  /health          → service health check
  GET  /engine          → which NLP model is active
  POST /sentiment       → analyse a list of review texts
"""

import logging
import time
from typing import List

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

import sentiment as sentiment_engine

# ─── Logging setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai-service")

# ─── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Amazon Sentiment AI Service",
    description="Sentiment analysis using DistilBERT (or VADER fallback).",
    version="1.0.0",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# ─── Request / Response models ────────────────────────────────────────────────

class SentimentRequest(BaseModel):
    texts: List[str]

    @field_validator("texts")
    @classmethod
    def texts_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("texts list must contain at least one item.")
        if len(v) > 200:
            raise ValueError("Maximum 200 texts per request.")
        return v


class SentimentResult(BaseModel):
    label: str   # "positive" | "negative" | "neutral"
    score: float # 0–1 confidence


class SentimentResponse(BaseModel):
    results: List[SentimentResult]
    count: int
    engine: str
    elapsed_ms: float


# ─── Middleware: request logging ──────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({elapsed}ms)")
    return response


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Basic liveness probe."""
    return {
        "status": "ok",
        "service": "amazon-sentiment-ai",
        "version": "1.0.0",
    }


@app.get("/engine")
def engine_info():
    """Returns which NLP engine (DistilBERT vs VADER) is active."""
    return sentiment_engine.get_engine_info()


@app.post("/sentiment", response_model=SentimentResponse)
def analyze_sentiment(payload: SentimentRequest):
    """
    Accepts a list of review texts and returns sentiment labels + scores.

    Request body:
        { "texts": ["Great product!", "Terrible quality.", ...] }

    Response:
        {
          "results": [{"label": "positive", "score": 0.997}, …],
          "count": N,
          "engine": "distilbert" | "vader",
          "elapsed_ms": 123.4
        }
    """
    start = time.time()
    logger.info(f"Analysing {len(payload.texts)} review(s)…")

    try:
        raw_results = sentiment_engine.analyze_batch(payload.texts)
    except Exception as exc:
        logger.error(f"Sentiment analysis failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Sentiment analysis error: {str(exc)}")

    if len(raw_results) != len(payload.texts):
        raise HTTPException(
            status_code=500,
            detail="AI service returned mismatched number of results.",
        )

    elapsed = round((time.time() - start) * 1000, 2)
    engine_info = sentiment_engine.get_engine_info()

    return SentimentResponse(
        results=[SentimentResult(**r) for r in raw_results],
        count=len(raw_results),
        engine=engine_info["engine"],
        elapsed_ms=elapsed,
    )
