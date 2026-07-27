"""
Open Dental PMS Provider
Uses Open Dental's REST API (v1+).
Official docs: https://www.opendental.com/site/apimanual.html
Auth: API Key via X-OPENDENTAL-DEVELOPERKEY and X-OPENDENTAL-CUSTOMERKEY headers
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


class OpenDentalProvider(BasePMSProvider):
    PROVIDER_NAME = "open_dental"
    PROVIDER_DISPLAY_NAME = "Open Dental"
    SUPPORTS_WEBHOOKS = False
    AUTH_METHOD = "api_key"

    def _headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "Authorization": f"ODFHIR {self.config.api_key}",
        }

    def _base_url(self) -> str:
        url = self.config.api_url.rstrip("/")
        return f"{url}/api/v1"

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
                resp = await client.get(
                    f"{self._base_url()}/patients?Limit=1",
                    headers=self._headers()
                )
                latency = (time.monotonic() - start) * 1000
                if resp.status_code in (200, 201):
                    return {"success": True, "message": "Open Dental connected", "latency_ms": round(latency, 2)}
                return {"success": False, "message": f"HTTP {resp.status_code}: {resp.text[:200]}", "latency_ms": round(latency, 2)}
        except Exception as e:
            return {"success": False, "message": str(e), "latency_ms": 0}

    async def sync_patients(self, since: Optional[str] = None) -> SyncResult:
        errors, warnings, raw = [], [], []
        try:
            params = {"Limit": 500, "Offset": 0}
            if since:
                params["DateTimeEntry"] = since
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(f"{self._base_url()}/patients", headers=self._headers(), params=params)
                resp.raise_for_status()
                data = resp.json()
            for item in data:
                try:
                    raw.append(PatientRecord(
                        external_id=str(item.get("PatNum", "")),
                        first_name=item.get("FName", ""),
                        last_name=item.get("LName", ""),
                        date_of_birth=item.get("Birthdate"),
                        phone=item.get("WirelessPhone") or item.get("HmPhone"),
                        email=item.get("Email"),
                        address=item.get("Address"),
                        notes=item.get("AddrNote"),
                        extra=item,
                    ).__dict__)
                except Exception as ex:
                    errors.append(self._make_error("invalid_data", str(ex), str(item.get("PatNum"))))
            return SyncResult(
                success=True,
                records_processed=len(data),
                records_created=len(raw),
                errors=errors,
                warnings=warnings,
                raw_data=raw,
            )
        except httpx.HTTPStatusError as e:
            return SyncResult(success=False, error_message=f"HTTP {e.response.status_code}: {e.response.text[:200]}", errors=errors)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e), errors=errors)

    async def sync_appointments(self, since: Optional[str] = None) -> SyncResult:
        errors, raw = [], []
        try:
            params = {"Limit": 500}
            if since:
                params["dateStart"] = since[:10]
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(f"{self._base_url()}/appointments", headers=self._headers(), params=params)
                resp.raise_for_status()
                data = resp.json()
            for item in data:
                try:
                    raw.append(AppointmentRecord(
                        external_id=str(item.get("AptNum", "")),
                        patient_external_id=str(item.get("PatNum", "")),
                        provider_external_id=str(item.get("ProvNum", "")),
                        start_datetime=item.get("AptDateTime", ""),
                        end_datetime=item.get("AptDateTime", ""),
                        status=item.get("AptStatus", "scheduled").lower(),
                        operatory=str(item.get("Op", "")),
                        notes=item.get("Note"),
                        confirmed=item.get("Confirmed", 0) > 0,
                        extra=item,
                    ).__dict__)
                except Exception as ex:
                    errors.append(self._make_error("invalid_data", str(ex)))
            return SyncResult(success=True, records_processed=len(data), records_created=len(raw), errors=errors, raw_data=raw)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_providers(self) -> SyncResult:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(f"{self._base_url()}/providers", headers=self._headers())
                resp.raise_for_status()
                data = resp.json()
            raw = [ProviderRecord(
                external_id=str(p.get("ProvNum", "")),
                first_name=p.get("FName", ""),
                last_name=p.get("LName", ""),
                specialty=p.get("Specialty"),
                npi=p.get("NationalProvID"),
                is_active=not p.get("IsHidden", False),
                extra=p,
            ).__dict__ for p in data]
            return SyncResult(success=True, records_processed=len(data), records_created=len(raw), raw_data=raw)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_schedule(self, date_from: Optional[str] = None, date_to: Optional[str] = None) -> SyncResult:
        try:
            params = {}
            if date_from:
                params["dateStart"] = date_from
            if date_to:
                params["dateEnd"] = date_to
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(f"{self._base_url()}/schedules", headers=self._headers(), params=params)
                resp.raise_for_status()
                data = resp.json()
            return SyncResult(success=True, records_processed=len(data), records_created=len(data), raw_data=data)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_insurance(self) -> SyncResult:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(f"{self._base_url()}/insplans", headers=self._headers())
                resp.raise_for_status()
                data = resp.json()
            return SyncResult(success=True, records_processed=len(data), records_created=len(data), raw_data=data)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))

    async def sync_procedures(self) -> SyncResult:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(f"{self._base_url()}/procedurelog", headers=self._headers(), params={"Limit": 500})
                resp.raise_for_status()
                data = resp.json()
            return SyncResult(success=True, records_processed=len(data), records_created=len(data), raw_data=data)
        except Exception as e:
            return SyncResult(success=False, error_message=str(e))
