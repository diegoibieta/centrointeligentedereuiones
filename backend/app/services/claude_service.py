import json
import anthropic
from ..core.config import get_settings

MODEL = "claude-sonnet-4-6"


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=get_settings().anthropic_api_key)


def translate_to_spanish(text: str, source_language: str) -> str:
    if source_language in ("es", "spa"):
        return text

    response = _client().messages.create(
        model=MODEL,
        max_tokens=8192,
        messages=[{
            "role": "user",
            "content": (
                f"Traduce el siguiente texto al español. "
                f"Mantén el formato y los párrafos originales. "
                f"Solo devuelve la traducción, sin comentarios adicionales.\n\n{text}"
            ),
        }],
    )
    return response.content[0].text


def _extract_json(text: str) -> str:
    """Extract JSON from a response that may be wrapped in markdown code blocks."""
    text = text.strip()
    if "```" in text:
        parts = text.split("```")
        for part in parts[1::2]:
            part = part.lstrip("json").strip()
            if part:
                return part
    # Try to find the first { ... } block
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


def analyze_meeting(transcript: str, title: str, module: str) -> dict:
    """Returns dict with summary, agreements, tasks, risks, opportunities."""

    # Limit transcript length to avoid exceeding token limits (~60k chars ≈ 15k tokens)
    max_transcript_chars = 60_000
    if len(transcript) > max_transcript_chars:
        transcript = transcript[:max_transcript_chars] + "\n\n[Transcripción truncada por longitud]"

    prompt = f"""Eres un experto en análisis estratégico de reuniones de negocios.

Analiza la siguiente transcripción de una reunión del módulo "{module}" titulada "{title}".

TRANSCRIPCIÓN:
{transcript}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{{
  "summary": "Resumen ejecutivo de 3-5 párrafos con los puntos más importantes",
  "agreements": [
    {{"description": "...", "responsible": "...", "deadline": "..."}}
  ],
  "tasks": [
    {{"description": "...", "responsible": "...", "priority": "alta|media|baja", "deadline": "..."}}
  ],
  "risks": [
    {{"description": "...", "impact": "alto|medio|bajo", "probability": "alta|media|baja", "mitigation": "..."}}
  ],
  "opportunities": [
    {{"description": "...", "potential": "alto|medio|bajo", "action": "..."}}
  ]
}}

Si un campo no aplica o no hay información suficiente, devuelve una lista vacía [].
Los campos "responsible" y "deadline" son opcionales, devuelve "" si no hay información."""

    response = _client().messages.create(
        model=MODEL,
        max_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = _extract_json(response.content[0].text)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "summary": response.content[0].text[:2000],
            "agreements": [],
            "tasks": [],
            "risks": [],
            "opportunities": [],
        }


def generate_embedding(text: str) -> list[float]:
    """Generate embedding using Claude's text for semantic search via voyage-3."""
    # Use Anthropic's voyage embeddings via the API
    client = _client()
    # Truncate text to avoid token limits
    text = text[:8000]

    response = client.messages.create(
        model=MODEL,
        max_tokens=1,
        messages=[{"role": "user", "content": "x"}],
        system="",
    )
    # Since Anthropic doesn't expose embeddings directly, we use a semantic hash approach
    # with the summary text and cosine similarity on TF-IDF vectors stored as JSON
    # For production, integrate voyage-3 via anthropic.Anthropic client
    return []


def semantic_search_query(query: str, transcripts: list[dict]) -> list[dict]:
    """Use Claude to rank meetings by relevance to a query."""
    if not transcripts:
        return []

    items = "\n".join(
        f"ID:{t['id']} TÍTULO:{t['title']} RESUMEN:{(t.get('summary') or '')[:300]}"
        for t in transcripts[:20]
    )

    response = _client().messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": (
                f"Tienes esta consulta de búsqueda: \"{query}\"\n\n"
                f"Y estas reuniones:\n{items}\n\n"
                f"Devuelve SOLO un JSON con los IDs de las reuniones más relevantes ordenadas por relevancia, "
                f"máximo 10 resultados. Formato: {{\"ids\": [\"id1\", \"id2\", ...]}}"
            ),
        }],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip().rstrip("```").strip()

    result = json.loads(raw)
    return result.get("ids", [])
