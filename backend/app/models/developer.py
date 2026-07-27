import uuid
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Boolean, JSON, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

class APIKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    key_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    key_prefix: Mapped[str] = mapped_column(String(10)) # e.g. rev_xxxx
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    scopes: Mapped[list[str]] = mapped_column(JSON, default=list)
    
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

class WebhookSubscription(Base):
    __tablename__ = "webhook_subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    url: Mapped[str] = mapped_column(String(1024))
    secret: Mapped[str] = mapped_column(String(255)) # Used to sign payloads
    events: Mapped[list[str]] = mapped_column(JSON, default=list) # e.g. ["patient.created", "appointment.booked"]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), index=True)

class Plugin(Base):
    __tablename__ = "plugins"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[str] = mapped_column(Text)
    author: Mapped[str] = mapped_column(String(255))
    version: Mapped[str] = mapped_column(String(50))
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    config_schema: Mapped[dict] = mapped_column(JSON, default=dict)
    
class InstalledPlugin(Base):
    __tablename__ = "installed_plugins"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    plugin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("plugins.id", ondelete="CASCADE"))
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), index=True)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    plugin: Mapped["Plugin"] = relationship("Plugin")
