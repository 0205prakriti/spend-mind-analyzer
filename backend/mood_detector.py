from functools import lru_cache

from transformers import pipeline


@lru_cache(maxsize=1)
def _get_emotion_model():
    return pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
    )


def detect_emotion(text: str) -> dict:
    if not text.strip():
        return {"emotion": "neutral", "score": 0.0}

    try:
        result = _get_emotion_model()(text)[0]
    except Exception:
        # Keep API responsive even if model loading/inference fails.
        return {"emotion": "neutral", "score": 0.0}

    return {
        "emotion": result["label"],
        "score": round(result["score"], 3),
    }