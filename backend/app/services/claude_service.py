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
                f"Traduce el siguiente texto al espanol. "
                f"Manten el formato y los parrafos originales. "
                f"Solo devuelve la traduccion, sin comentarios adicionales.\n\n{text}"
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
        transcript = transcript[:max_transcript_chars] + "\n\n[Transcripcion truncada por longitud]"

    prompt = f"""Eres un experto en analisis estrategico de reuniones de negocios.

Analiza la transcripcion de la reunion "{title}" (modulo: {module}).

TRANSCRIPCION:
{transcript}

Responde UNICAMENTE con JSON valido con esta estructura:
{{
  "summary": "Resumen ejecutivo de 2 parrafos cortos (aproximadamente 6 oraciones) con los puntos mas importantes de la reunion: contexto, decisiones clave, y proximos pasos",
  "agreements": [
    {{"description": "acuerdo concreto en 1 oracion", "responsible": "nombre o vacio", "deadline": "fecha o vacio"}}
  ],
  "tasks": [
    {{"description": "tarea concreta en 1 oracion", "responsible": "nombre o vacio", "priority": "alta|media|baja", "deadline": "fecha o vacio"}}
  ],
  "risks": [
    {{"description": "riesgo concreto en 1 oracion", "impact": "alto|medio|bajo", "probability": "alta|media|baja", "mitigation": "accion en 1 oracion o vacio"}}
  ],
  "opportunities": [
    {{"description": "oportunidad concreta en 1 oracion", "potential": "alto|medio|bajo", "action": "accion en 1 oracion o vacio"}}
  ]
}}

Reglas:
- Si no hay acuerdos, tareas, riesgos u oportunidades REALES en la conversacion, devuelve lista vacia [].
- No inventes informacion que no este en la transcripcion.
- Cada item maximo 1 oracion corta."""

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


def answer_question(question: str, context_blocks: list[str]) -> str:
    if not context_blocks:
        return "No encontre reuniones relevantes para responder esa pregunta."

    context = "\n\n---\n\n".join(context_blocks)

    response = _client().messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": (
                f"Eres un asistente de memoria organizacional. "
                f"Responde la siguiente pregunta basandote UNICAMENTE en la informacion de las reuniones que se te proporcionan. "
                f"Se conciso y cita de que reunion viene cada dato entre parentesis.\n\n"
                f"PREGUNTA: {question}\n\n"
                f"INFORMACION DE REUNIONES:\n{context}\n\n"
                f"Si la informacion no es suficiente para responder, dilo claramente."
            ),
        }],
    )
    return response.content[0].text


def generate_embedding(text: str) -> list[float]:
    return []


def semantic_search_query(query: str, transcripts: list[dict]) -> list[dict]:
    if not transcripts:
        return []

    items = "\n".join(
        f"ID:{t['id']} TITULO:{t['title']} RESUMEN:{(t.get('summary') or '')[:300]}"
        for t in transcripts[:20]
    )

    response = _client().messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": (
                f"Tienes esta consulta de busqueda: \"{query}\"\n\n"
                f"Y estas reuniones:\n{items}\n\n"
                f"Devuelve SOLO un JSON con los IDs de las reuniones mas relevantes ordenadas por relevancia, "
                f"maximo 10 resultados. Formato: {{\"ids\": [\"id1\", \"id2\", ...]}}"
            ),
        }],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip().rstrip("```").strip()

    result = json.loads(raw)
    return result.get("ids", [])