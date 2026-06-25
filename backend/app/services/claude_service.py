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
    text = text.strip()
    if "```" in text:
        parts = text.split("```")
        for part in parts[1::2]:
            part = part.lstrip("json").strip()
            if part:
                return part
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


def analyze_meeting(transcript: str, title: str, module: str) -> dict:
    max_transcript_chars = 60_000
    if len(transcript) > max_transcript_chars:
        transcript = transcript[:max_transcript_chars] + "\n\n[Transcripción truncada por longitud]"

    prompt = f"""Eres un experto en análisis estratégico de reuniones de negocios. Sé muy conciso.

Analiza la transcripción de la reunión "{title}" (módulo: {module}).

TRANSCRIPCIÓN:
{transcript}

Responde ÚNICAMENTE con JSON válido con esta estructura:
{{
  "summary": "Resumen ejecutivo de 2 párrafos cortos (aproximadamente 6 oraciones) con los puntos más importantes de la reunión: contexto, decisiones clave, y próximos pasos",
  "agreements": [
    {{"description": "acuerdo concreto en 1 oración", "responsible": "nombre o vacío", "deadline": "fecha o vacío"}}
  ],
  "tasks": [
    {{"description": "tarea concreta en 1 oración", "responsible": "nombre o vacío", "priority": "alta|media|baja", "deadline": "fecha o vacío"}}
  ],
  "risks": [
    {{"description": "riesgo concreto en 1 oración", "impact": "alto|medio|bajo", "probability": "alta|media|baja", "mitigation": "acción en 1 oración o vacío"}}
  ],
  "opportunities": [
    {{"description": "oportunidad concreta en 1 oración", "potential": "alto|medio|bajo", "action": "acción en 1 oración o vacío"}}
  ]
}}

Reglas:
- Si no hay acuerdos, tareas, riesgos u oportunidades REALES en la conversación, devuelve lista vacía [].
- No inventes información que no esté en la transcripción.
- Cada ítem máximo 1 oración corta."""

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
    return []


def semantic_search_query(query: str, transcripts: list[dict]) -> list[dict]:
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
