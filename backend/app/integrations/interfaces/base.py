"""
Abstract base interface for all PMS providers.
Every provider MUST implement all methods defined here.
The rest of the application never needs to know which PMS is in use.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class ConnectionConfig:
    """Provider-agnostic connection configuration."""
    api_url: str = ""
    api_key: str = ""
    username: str = ""
    password: str = ""
    client_id: str = ""
    client_secret: str = ""
    refresh_token: str = ""
    access_token: str = ""
    environment: str = "production"
    extra: dict = field(default_factory=dict)


@dataclass
class SyncResult:
    """Standardized result returned by every sync operation."""
    success: bool
    records_processed: int = 0
    records_created: int = 0
    records_updated: int = 0
    records_skipped: int = 0
    errors: list[dict] = field(default_factory=list)
    warnings: list[dict] = field(default_factory=list)
    raw_data: list[dict] = field(default_factory=list)
    error_message: Optional[str] = None


@dataclass
class PatientRecord:
    """Canonical patient record — provider-agnostic."""
    external_id: str
    first_name: str
    last_name: str
    date_of_birth: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    insurance_id: Optional[str] = None
    insurance_name: Optional[str] = None
    last_visit: Optional[str] = None
    next_appointment: Optional[str] = None
    preferred_provider: Optional[str] = None
    notes: Optional[str] = None
    extra: dict = field(default_factory=dict)


@dataclass
class AppointmentRecord:
    """Canonical appointment record — provider-agnostic."""
    external_id: str
    patient_external_id: str
    provider_external_id: str
    start_datetime: str
    end_datetime: str
    status: str  # scheduled, confirmed, arrived, completed, cancelled, no_show
    operatory: Optional[str] = None
    procedure_codes: list[str] = field(default_factory=list)
    notes: Optional[str] = None
    confirmed: bool = False
    extra: dict = field(default_factory=dict)


@dataclass
class ProviderRecord:
    """Canonical provider/doctor record — provider-agnostic."""
    external_id: str
    first_name: str
    last_name: str
    specialty: Optional[str] = None
    npi: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    extra: dict = field(default_factory=dict)


class BasePMSProvider(ABC):
    """
    Abstract base class for all PMS integrations.

    Each provider (Open Dental, Dentrix, Eaglesoft, etc.) must implement
    all abstract methods. The Integration Manager uses this interface
    exclusively — it never calls provider-specific code directly.
    """

    PROVIDER_NAME: str = "base"
    PROVIDER_DISPLAY_NAME: str = "Base Provider"
    SUPPORTS_WEBHOOKS: bool = False
    SUPPORTS_REALTIME: bool = False
    AUTH_METHOD: str = "api_key"

    def __init__(self, config: ConnectionConfig):
        self.config = config
        self._connected = False

    # ── Connection ─────────────────────────────────────────────────────────────

    @abstractmethod
    async def connect(self) -> bool:
        """
        Establish connection to the PMS.
        Returns True if successful.
        """
        ...

    @abstractmethod
    async def disconnect(self) -> bool:
        """Close connection and clean up resources."""
        ...

    @abstractmethod
    async def test_connection(self) -> dict:
        """
        Verify the connection is alive.
        Returns {"success": bool, "message": str, "latency_ms": float}
        """
        ...

    # ── Sync Operations ────────────────────────────────────────────────────────

    @abstractmethod
    async def sync_patients(self, since: Optional[str] = None) -> SyncResult:
        """
        Fetch all patients (or changed since `since` ISO8601 datetime).
        Returns SyncResult with raw_data as list of PatientRecord dicts.
        """
        ...

    @abstractmethod
    async def sync_appointments(self, since: Optional[str] = None) -> SyncResult:
        """
        Fetch appointments (or changed since `since`).
        Returns SyncResult with raw_data as list of AppointmentRecord dicts.
        """
        ...

    @abstractmethod
    async def sync_providers(self) -> SyncResult:
        """Fetch all providers/doctors in this practice."""
        ...

    @abstractmethod
    async def sync_schedule(self, date_from: Optional[str] = None, date_to: Optional[str] = None) -> SyncResult:
        """Fetch schedule availability for a date range."""
        ...

    @abstractmethod
    async def sync_insurance(self) -> SyncResult:
        """Fetch insurance plans accepted by this practice."""
        ...

    @abstractmethod
    async def sync_procedures(self) -> SyncResult:
        """Fetch procedure codes and treatment plan data."""
        ...

    # ── Webhook Handler ────────────────────────────────────────────────────────

    async def webhook_handler(self, event_type: str, payload: dict) -> dict:
        """
        Handle incoming webhook events from the PMS.
        Default implementation is a no-op for providers that don't support webhooks.
        """
        return {"handled": False, "reason": "webhooks_not_supported"}

    async def validate_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Validate incoming webhook HMAC signature."""
        return True  # Override in providers that support webhook signing

    # ── Utilities ─────────────────────────────────────────────────────────────

    @property
    def is_connected(self) -> bool:
        return self._connected

    def _make_error(self, error_type: str, message: str, record_id: Optional[str] = None) -> dict:
        return {
            "error_type": error_type,
            "message": message,
            "record_id": record_id,
        }

    def _make_warning(self, message: str, record_id: Optional[str] = None) -> dict:
        return {"message": message, "record_id": record_id}
