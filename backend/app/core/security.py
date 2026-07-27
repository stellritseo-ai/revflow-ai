import html
from pydantic import BaseModel, model_validator
from typing import Any

def sanitize_string(value: str) -> str:
    """
    Basic HTML escaping to prevent XSS (Cross-Site Scripting).
    Converts characters like <, >, &, ", ' into HTML-safe entities.
    """
    if not isinstance(value, str):
        return value
    return html.escape(value, quote=True)

class SanitizedBaseModel(BaseModel):
    """
    A Pydantic base model that automatically sanitizes all string fields
    to prevent HTML Injection and XSS attacks.
    """
    
    @model_validator(mode='before')
    @classmethod
    def sanitize_strings(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return {k: sanitize_string(v) if isinstance(v, str) else v for k, v in data.items()}
        return data
