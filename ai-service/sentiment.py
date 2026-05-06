"""
sentiment.py — Sentiment analysis engine

Primary:  HuggingFace DistilBERT (distilbert-base-uncased-finetuned-sst-2-english)
Fallback: VADER (rule-based, no GPU/model needed)

The module tries to load DistilBERT on startup. If that fails for any reason
(memory, missing torch, etc.) it transparently falls back to VADER.
"""

import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

# ─── Attempt to load DistilBERT ───────────────────────────────────────────────

_pipeline   = None   # HuggingFace pipeline
_use_vader  = False  # Flag for fallback mode

try:
    from transformers import pipeline as hf_pipeline

    logger.info("Loading DistilBERT sentiment model (first run may take a minute)…")
    _pipeline = hf_pipeline(
        "sentiment-analysis",
        model="distilbert-base-uncased-finetuned-sst-2-english",
        # Truncate inputs that exceed the model's 512-token limit
        truncation=True,
        max_length=512,
    )
    logger.info("✅ DistilBERT loaded successfully.")

except Exception as e:
    logger.warning(f"⚠️  Could not load DistilBERT ({e}). Falling back to VADER.")
    _use_vader = True

# ─── Always load VADER as a safety net ───────────────────────────────────────

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    _vader = SentimentIntensityAnalyzer()
    logger.info("VADER loaded.")
except Exception as e:
    logger.error(f"VADER also failed to load: {e}")
    _vader = None


# ─── Label mapping helpers ────────────────────────────────────────────────────

def _hf_label_to_standard(label: str) -> str:
    """
    DistilBERT returns 'POSITIVE' / 'NEGATIVE'.
    We map those to lowercase and derive neutral from low-confidence predictions.
    """
    return label.lower()  # 'positive' | 'negative'


def _vader_label(compound: float) -> str:
    """
    VADER compound score → sentiment label.
    Thresholds recommended by the VADER paper.
    """
    if compound >= 0.05:
        return "positive"
    elif compound <= -0.05:
        return "negative"
    else:
        return "neutral"


# ─── Public API ───────────────────────────────────────────────────────────────

def analyze_batch(texts: List[str]) -> List[Dict]:
    """
    Analyse a list of review texts and return a list of result dicts:
        [{"label": "positive"|"negative"|"neutral", "score": float}, …]

    Args:
        texts: List of review text strings.

    Returns:
        List of dicts with `label` and `score` (0–1 confidence).
    """
    if not texts:
        return []

    # ── HuggingFace / DistilBERT path ────────────────────────────────────────
    if _pipeline is not None and not _use_vader:
        try:
            results = []
            # Process in small batches to manage memory
            batch_size = 16
            for i in range(0, len(texts), batch_size):
                chunk  = texts[i : i + batch_size]
                # Truncate very long texts before passing to pipeline
                chunk  = [t[:2000] for t in chunk]
                preds  = _pipeline(chunk)

                for pred in preds:
                    raw_label = pred.get("label", "NEGATIVE")
                    score     = float(pred.get("score", 0.5))

                    # Assign neutral if the model is not confident (< 70%)
                    if score < 0.70:
                        label = "neutral"
                    else:
                        label = _hf_label_to_standard(raw_label)

                    results.append({"label": label, "score": round(score, 4)})

            logger.debug(f"DistilBERT analysed {len(results)} texts.")
            return results

        except Exception as e:
            logger.error(f"DistilBERT inference failed ({e}). Falling back to VADER for this batch.")
            # Fall through to VADER below

    # ── VADER fallback path ──────────────────────────────────────────────────
    if _vader is None:
        raise RuntimeError("Neither DistilBERT nor VADER is available. Cannot perform sentiment analysis.")

    results = []
    for text in texts:
        try:
            scores   = _vader.polarity_scores(text)
            compound = scores["compound"]
            label    = _vader_label(compound)
            # Normalise compound from [-1, 1] to [0, 1] for a consistent score field
            normalised = round((compound + 1) / 2, 4)
            results.append({"label": label, "score": normalised})
        except Exception as e:
            logger.warning(f"VADER failed on a text: {e}. Defaulting to neutral.")
            results.append({"label": "neutral", "score": 0.5})

    logger.debug(f"VADER analysed {len(results)} texts.")
    return results


def get_engine_info() -> Dict:
    """Returns which NLP engine is active."""
    if _pipeline is not None and not _use_vader:
        return {"engine": "distilbert", "model": "distilbert-base-uncased-finetuned-sst-2-english"}
    elif _vader is not None:
        return {"engine": "vader", "model": "vaderSentiment 3.3.2"}
    else:
        return {"engine": "none", "model": "unavailable"}
