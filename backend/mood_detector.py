from functools import lru_cache
import logging

from transformers import pipeline

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_emotion_model():
    return pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
    )


def detect_emotion(text: str) -> dict:
    if not text.strip():
        return {"emotion": "neutral", "score": 0.0, "model_available": True}

    try:
        result = _get_emotion_model()(text)[0]
    except Exception as exc:
        # Keep API responsive even if model loading/inference fails.
        logger.warning("Emotion model unavailable; using neutral fallback: %s", exc)
        return {"emotion": "neutral", "score": 0.0, "model_available": False}

    return {
        "emotion": result["label"],
        "score": round(result["score"], 3),
        "model_available": True,
    }