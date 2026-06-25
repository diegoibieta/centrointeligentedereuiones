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
                f"Mantén el formato y los parrafos originales. "
                f"Solo devuelve la traduccion, sin comentarios adicionales.\n\n{text}"
            ),
        }],
    )
    return response.content[0].text
def analyze_meeting(transcript: str, title: str, module: str) -> dict:
    prompt = f"""Eres un experto en analisis estrategico de reuniones de negocios.
Analiza la siguiente transcripcion de una reunion del modulo "{module}" titulada "{title}".
TRANSCRIPCION:
{transcript}
Responde UNICAMENTE con un JSON valido con esta estructura exacta:
{{
  "summary": "Resumen ejecutivo de 3-5 parrafos con los puntos mas importantes",
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
Si un campo no aplica devuelve lista vacia [].
Los campos responsible y deadline son opcionales, devuelve "" si no hay informacion."""
    response = _client().messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()
    if raw.startswith("`"):
        raw = raw.split("`")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip().rstrip("`").strip()
    return json.loads(raw)
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
    if raw.startswith("`"):
        raw = raw.split("`")[1].lstrip("json").strip().rstrip("`").strip()
    result = json.loads(raw)
    return result.get("ids", [])
