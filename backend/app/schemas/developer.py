import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# API Keys
class APIKeyCreate(BaseModel):
    name: str
    scopes: List[str] = []

class APIKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    key_prefix: str
    is_active: bool
    scopes: List[str]
    client_id: uuid.UUID

class APIKeyGenerateResponse(APIKeyResponse):
    key: str # Full key, only returned once

# Webhooks
class WebhookCreate(BaseModel):
    url: str
    events: List[str]

class WebhookResponse(WebhookCreate):
    id: uuid.UUID
    is_active: bool
    client_id: uuid.UUID

# Plugins
class PluginCreate(BaseModel):
    name: str
    description: str
    author: str
    version: str
    config_schema: Dict[str, Any]

class PluginResponse(PluginCreate):
    id: uuid.UUID
    is_published: bool

# Installed Plugins
class InstalledPluginCreate(BaseModel):
    plugin_id: uuid.UUID
    config: Dict[str, Any]

class InstalledPluginResponse(BaseModel):
    id: uuid.UUID
    plugin_id: uuid.UUID
    client_id: uuid.UUID
    is_enabled: bool
    config: Dict[str, Any]
