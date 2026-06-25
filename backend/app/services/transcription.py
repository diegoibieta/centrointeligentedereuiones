from faster_whisper import WhisperModel
from ..core.config import get_settings
import os
_model: WhisperModel | None = None
def get_model() -> WhisperModel:
    global _model
    if _model is None:
        settings = get_settings()
        _model = WhisperModel(settings.whisper_model, device="cpu", compute_type="int8")
    return _model
def transcribe(audio_path: str) -> tuple[str, str, float]:
    model = get_model()
    segments, info = model.transcribe(audio_path, beam_size=5)
    text_parts = []
    duration = 0.0
    for segment in segments:
        text_parts.append(segment.text.strip())
        duration = max(duration, segment.end)
    transcript = " ".join(text_parts)
    return transcript, info.language, duration
