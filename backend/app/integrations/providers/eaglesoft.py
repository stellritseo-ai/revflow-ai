"""
Eaglesoft PMS Provider
Patterson Eaglesoft uses a local database/REST hybrid.
Auth: Username + Password (Basic Auth or Token)
"""
from __future__ import annotations
import base64
import time
from typing import Optional
import httpx
import structlog

from app.integrations.interfaces.base import (
    BasePMSProvider, ConnectionConfig, SyncResult,
    PatientRecord, AppointmentRecord, ProviderRecord
)

logger = structlog.get_logger()


class EaglesoftProvider(BasePMSProvider):
    PROVIDER_NAME = "eaglesoft"
    PROVIDER_DISPLAY_NAME = "Eaglesoft"
    SUPPORTS_WEBHOOKS = False
    AUTH_METHOD = "username_password"

    def _base_url(self) -> str:
        return (self.config.api_url or "https://api.eaglesoft.net").rstrip("/")

    def _headers(self) -> dict:
        credentials = f"{self.config.username}:{self.config.password}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/json",
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
                resp = await client.get(f"{self._base_url()}/api/patients?pageSize=1", headers=self._headers())
                latency = (time.monotonic() - start) * 1000
                if resp.status_code == 200:
                    return {"success": True, "message": "Eaglesoft connected", "latency_ms": round(latency, 2)}
                return {"success": False, "message": f"HTTP {resp.status_code}", "latency_ms": round(latency, 2)}
        except Exception as e:
            return {"success": False, "message": str(e), "latency_ms": 0}

    async def sync_patients(self, since: Optional[str] = None) -> SyncResult:
        errors, raw = [], []
        try:
            params = {"pageSize": 500}
            if since:
                params["lastModifiedAfter"] = since
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(f"{self._base_url()}/api/patients", headers=self._headers(), params=params)
                resp.raise_for_status()
                items = resp.json().get("patients", resp.json())
            for item in items:
                try:
                    raw.append(PatientRecord(
                        external_id=str(item.get("patientId", item.get("PatientID", ""))),
                        first_name=item.get("firstName", item.get("FirstName", "")),
                        last_name=item.get("lastName", item.get("LastName", "")),
                        date_of_birth=item.get("birthDate", item.get("DateOfBirth")),
                        phone=item.get("cellPhone") or item.get("homePhone"),
                        email=item.get("emailAddress"),
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
                resp = await client.get(f"{self._base_url()}/api/appointments", headers=self._headers(), params=params)
                resp.raise_for_status()
                items = resp.json().get("appointments", resp.json())
            for item in items:
                try:
                    raw.append(AppointmentRecord(
                        external_id=str(item.get("appointmentId", "")),
                        patient_external_id=str(item.get("patientId", "")),
                        provider_external_id=str(item.get("providerId", "")),
                        start_datetime=item.get("startDateTime", ""),
                        end_datetime=item.get("endDateTime", ""),
                        status=item.get("status", "scheduled").lower(),
                        operatory=item.get("operatory"),
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
                resp = await client.get(f"{self._base_url()}/api/providers", headers=self._headers())
                resp.raise_for_status()
                items = resp.json().get("providers", resp.json())
            raw = [ProviderRecord(
                external_id=str(p.get("providerId", "")),
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
                resp = await client.get(f"{self._base_url()}/api/schedule", headers=self._headers(), params=params)
                resp.raise_for_status()
                data = resp.json()
            return SyncResult(success=True, records_processed=len(data), records_created=len(data), raw_data=data)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_insurance(self) -> SyncResult:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(f"{self._base_url()}/api/insurance-carriers", headers=self._headers())
                resp.raise_for_status()
                data = resp.json()
            return SyncResult(success=True, records_processed=len(data), records_created=len(data), raw_data=data)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_procedures(self) -> SyncResult:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(f"{self._base_url()}/api/procedures", headers=self._headers())
                resp.raise_for_status()
                data = resp.json()
            return SyncResult(success=True, records_processed=len(data), records_created=len(data), raw_data=data)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))
