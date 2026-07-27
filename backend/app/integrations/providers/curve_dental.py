"""
Curve Dental PMS Provider
Cloud-native dental software with REST API.
Auth: API Key via Bearer token
Official docs: https://www.curvedental.com/api
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


class CurveDentalProvider(BasePMSProvider):
    PROVIDER_NAME = "curve_dental"
    PROVIDER_DISPLAY_NAME = "Curve Dental"
    SUPPORTS_WEBHOOKS = True
    AUTH_METHOD = "api_key"

    def _base_url(self) -> str:
        return (self.config.api_url or "https://api.curvedental.com").rstrip("/")

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
            "X-API-Version": "2024-01",
        }

    async def connect(self) -> bool:
        result = await self.test_connection()
        self._connected = result["success"]
        return self._connected

    async def disconnect(self) -> bool:
        self._connected = False
        return True

    async def test_connection(self) -> dict:
        start = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self._base_url()}/v3/patients?limit=1", headers=self._headers())
                latency = (time.monotonic() - start) * 1000
                if resp.status_code == 200:
                    return {"success": True, "message": "Curve Dental connected", "latency_ms": round(latency, 2)}
                return {"success": False, "message": f"HTTP {resp.status_code}: {resp.text[:200]}", "latency_ms": round(latency, 2)}
        except Exception as e:
            return {"success": False, "message": str(e), "latency_ms": 0}

    async def sync_patients(self, since: Optional[str] = None) -> SyncResult:
        errors, raw = [], []
        try:
            params = {"limit": 500}
            if since:
                params["updatedAfter"] = since
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(f"{self._base_url()}/v3/patients", headers=self._headers(), params=params)
                resp.raise_for_status()
                page = resp.json()
                items = page.get("items", page.get("data", page)) if isinstance(page, dict) else page
            for item in items:
                try:
                    name = item.get("name", {}) if isinstance(item.get("name"), dict) else {}
                    raw.append(PatientRecord(
                        external_id=str(item.get("id", "")),
                        first_name=name.get("first", item.get("firstName", "")),
                        last_name=name.get("last", item.get("lastName", "")),
                        date_of_birth=item.get("dateOfBirth"),
                        phone=item.get("phone", {}).get("mobile") if isinstance(item.get("phone"), dict) else item.get("phone"),
                        email=item.get("email"),
                        address=item.get("address", {}).get("street1") if isinstance(item.get("address"), dict) else None,
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
            params = {"limit": 500}
            if since:
                params["startDate"] = since[:10]
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(f"{self._base_url()}/v3/appointments", headers=self._headers(), params=params)
                resp.raise_for_status()
                page = resp.json()
                items = page.get("items", page.get("data", page)) if isinstance(page, dict) else page
            for item in items:
                try:
                    raw.append(AppointmentRecord(
                        external_id=str(item.get("id", "")),
                        patient_external_id=str(item.get("patientId", "")),
                        provider_external_id=str(item.get("providerId", "")),
                        start_datetime=item.get("start", ""),
                        end_datetime=item.get("end", ""),
                        status=item.get("status", "scheduled").lower(),
                        operatory=item.get("operatory"),
                        notes=item.get("note"),
                        confirmed=item.get("confirmed", False),
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
                resp = await client.get(f"{self._base_url()}/v3/providers", headers=self._headers())
                resp.raise_for_status()
                page = resp.json()
                items = page.get("items", page.get("data", page)) if isinstance(page, dict) else page
            raw = [ProviderRecord(
                external_id=str(p.get("id", "")),
                first_name=p.get("firstName", ""),
                last_name=p.get("lastName", ""),
                specialty=p.get("specialty"),
                npi=p.get("npi"),
                is_active=p.get("active", True),
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
                resp = await client.get(f"{self._base_url()}/v3/schedule/slots", headers=self._headers(), params=params)
                resp.raise_for_status()
                data = resp.json()
            items = data.get("items", data) if isinstance(data, dict) else data
            return SyncResult(success=True, records_processed=len(items), records_created=len(items), raw_data=items)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_insurance(self) -> SyncResult:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(f"{self._base_url()}/v3/insurance", headers=self._headers())
                resp.raise_for_status()
                page = resp.json()
                items = page.get("items", page.get("data", page)) if isinstance(page, dict) else page
            return SyncResult(success=True, records_processed=len(items), records_created=len(items), raw_data=items)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_procedures(self) -> SyncResult:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(f"{self._base_url()}/v3/procedures", headers=self._headers())
                resp.raise_for_status()
                page = resp.json()
                items = page.get("items", page.get("data", page)) if isinstance(page, dict) else page
            return SyncResult(success=True, records_processed=len(items), records_created=len(items), raw_data=items)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def webhook_handler(self, event_type: str, payload: dict) -> dict:
        logger.info("Curve Dental webhook received", event_type=event_type)
        return {"handled": True, "event_type": event_type, "provider": "curve_dental"}
