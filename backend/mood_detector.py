from transformers import pipeline

print("Loading emotion model...")
emotion_model = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base"
)

def detect_emotion(text: str) -> dict:
    if not text.strip():
        return {"emotion": "neutral", "score": 0.0}
    result = emotion_model(text)[0]
    return {
        "emotion": result["label"],
        "score": round(result["score"], 3)
    }