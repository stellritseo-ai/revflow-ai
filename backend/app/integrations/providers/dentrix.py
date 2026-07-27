"""
Dentrix PMS Provider
Uses Dentrix Enterprise / Dentrix Ascend REST API.
Auth: OAuth 2.0 (client_credentials grant)
Official docs: https://developer.dentrix.com/
"""
from __future__ import annotations
import time
from typing import Optional
import httpx
import structlog

from app.integrations.interfaces.base import (
    BasePMSProvider, ConnectionConfig, SyncResult,
    PatientRecord, AppointmentRecord, ProviderRecord
)

logger = structlog.get_logger()


class DentrixProvider(BasePMSProvider):
    PROVIDER_NAME = "dentrix"
    PROVIDER_DISPLAY_NAME = "Dentrix"
    SUPPORTS_WEBHOOKS = True
    AUTH_METHOD = "oauth2"

    def __init__(self, config: ConnectionConfig):
        super().__init__(config)
        self._access_token: Optional[str] = config.access_token or None

    def _base_url(self) -> str:
        return (self.config.api_url or "https://api.dentrixascend.com").rstrip("/")

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def _refresh_oauth_token(self) -> bool:
        """Exchange client credentials for access token."""
        try:
            token_url = f"{self._base_url()}/oauth/token"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(token_url, data={
                    "grant_type": "client_credentials",
                    "client_id": self.config.client_id or self.config.username,
                    "client_secret": self.config.client_secret or self.config.password,
                    "scope": "openid profile dentrix",
                })
                if resp.status_code == 200:
                    token_data = resp.json()
                    self._access_token = token_data.get("access_token")
                    return bool(self._access_token)
            return False
        except Exception as e:
            logger.error("Dentrix OAuth token refresh failed", error=str(e))
            return False

    async def connect(self) -> bool:
        if not self._access_token:
            success = await self._refresh_oauth_token()
            if not success:
                return False
        result = await self.test_connection()
        self._connected = result["success"]
        return self._connected

    async def disconnect(self) -> bool:
        self._connected = False
        self._access_token = None
        return True

    async def test_connection(self) -> dict:
        start = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self._base_url()}/v1/patients?pageSize=1", headers=self._headers())
                latency = (time.monotonic() - start) * 1000
                if resp.status_code == 200:
                    return {"success": True, "message": "Dentrix connected", "latency_ms": round(latency, 2)}
                elif resp.status_code == 401:
                    # Try token refresh
                    await self._refresh_oauth_token()
                    return {"success": False, "message": "Auth token expired — please reconnect", "latency_ms": 0}
                return {"success": False, "message": f"HTTP {resp.status_code}", "latency_ms": round(latency, 2)}
        except Exception as e:
            return {"success": False, "message": str(e), "latency_ms": 0}

    async def sync_patients(self, since: Optional[str] = None) -> SyncResult:
        errors, raw = [], []
        try:
            params = {"pageSize": 500, "pageNumber": 1}
            if since:
                params["modifiedAfter"] = since
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(f"{self._base_url()}/v1/patients", headers=self._headers(), params=params)
                resp.raise_for_status()
                page = resp.json()
                items = page.get("data", page) if isinstance(page, dict) else page
            for item in items:
                try:
                    raw.append(PatientRecord(
                        external_id=str(item.get("patientId", item.get("id", ""))),
                        first_name=item.get("firstName", ""),
                        last_name=item.get("lastName", ""),
                        date_of_birth=item.get("dateOfBirth"),
                        phone=item.get("mobilePhone") or item.get("homePhone"),
                        email=item.get("email"),
                        address=item.get("address1"),
                        extra=item,
                    ).__dict__)
                except Exception as ex:
                    errors.append(self._make_error("invalid_data", str(ex)))
            return SyncResult(success=True, records_processed=len(items), records_created=len(raw), errors=errors, raw_data=raw)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_appointments(self, since: Optional[str] = None) -> SyncResult:
        errors, raw = [], []
        try:
            params = {"pageSize": 500}
            if since:
                params["startDate"] = since[:10]
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(f"{self._base_url()}/v1/appointments", headers=self._headers(), params=params)
                resp.raise_for_status()
                page = resp.json()
                items = page.get("data", page) if isinstance(page, dict) else page
            for item in items:
                try:
                    raw.append(AppointmentRecord(
                        external_id=str(item.get("appointmentId", item.get("id", ""))),
                        patient_external_id=str(item.get("patientId", "")),
                        provider_external_id=str(item.get("providerId", "")),
                        start_datetime=item.get("startTime", ""),
                        end_datetime=item.get("endTime", ""),
                        status=item.get("status", "scheduled").lower(),
                        operatory=item.get("operatoryId"),
                        notes=item.get("notes"),
                        extra=item,
                    ).__dict__)
                except Exception as ex:
                    errors.append(self._make_error("invalid_data", str(ex)))
            return SyncResult(success=True, records_processed=len(items), records_created=len(raw), errors=errors, raw_data=raw)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_providers(self) -> SyncResult:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(f"{self._base_url()}/v1/providers", headers=self._headers())
                resp.raise_for_status()
                page = resp.json()
                items = page.get("data", page) if isinstance(page, dict) else page
            raw = [ProviderRecord(
                external_id=str(p.get("providerId", p.get("id", ""))),
                first_name=p.get("firstName", ""),
                last_name=p.get("lastName", ""),
                specialty=p.get("specialty"),
                npi=p.get("npi"),
                is_active=p.get("isActive", True),
                extra=p,
            ).__dict__ for p in items]
            return SyncResult(success=True, records_processed=len(items), records_created=len(raw), raw_data=raw)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_schedule(self, date_from: Optional[str] = None, date_to: Optional[str] = None) -> SyncResult:
        try:
            params = {}
            if date_from:
                params["startDate"] = date_from
            if date_to:
                params["endDate"] = date_to
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(f"{self._base_url()}/v1/schedule", headers=self._headers(), params=params)
                resp.raise_for_status()
                data = resp.json()
            return SyncResult(success=True, records_processed=len(data), records_created=len(data), raw_data=data)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_insurance(self) -> SyncResult:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(f"{self._base_url()}/v1/insurance-plans", headers=self._headers())
                resp.raise_for_status()
                data = resp.json()
            return SyncResult(success=True, records_processed=len(data), records_created=len(data), raw_data=data)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_procedures(self) -> SyncResult:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(f"{self._base_url()}/v1/procedures", headers=self._headers())
                resp.raise_for_status()
                data = resp.json()
            return SyncResult(success=True, records_processed=len(data), records_created=len(data), raw_data=data)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def webhook_handler(self, event_type: str, payload: dict) -> dict:
        """Handle Dentrix webhook events."""
        logger.info("Dentrix webhook received", event_type=event_type)
        return {"handled": True, "event_type": event_type, "provider": "dentrix"}
