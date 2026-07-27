"""Mock PMS Provider — for development, testing, and demos."""
from __future__ import annotations
import asyncio
from typing import Optional
from app.integrations.interfaces.base import (
    BasePMSProvider, ConnectionConfig, SyncResult, PatientRecord, AppointmentRecord, ProviderRecord
)


class MockPMSProvider(BasePMSProvider):
    PROVIDER_NAME = "mock"
    PROVIDER_DISPLAY_NAME = "Mock Provider (Dev)"
    SUPPORTS_WEBHOOKS = False
    AUTH_METHOD = "none"

    async def connect(self) -> bool:
        await asyncio.sleep(0.1)
        self._connected = True
        return True

    async def disconnect(self) -> bool:
        self._connected = False
        return True

    async def test_connection(self) -> dict:
        return {"success": True, "message": "Mock connection OK", "latency_ms": 12.5}

    async def sync_patients(self, since: Optional[str] = None) -> SyncResult:
        patients = [
            PatientRecord(external_id="P001", first_name="Alice", last_name="Smith",
                          date_of_birth="1985-03-12", phone="+15551001001",
                          email="alice@example.com", insurance_name="Delta Dental"),
            PatientRecord(external_id="P002", first_name="Bob", last_name="Jones",
                          date_of_birth="1972-07-22", phone="+15551002002",
                          email="bob@example.com", insurance_name="MetLife"),
            PatientRecord(external_id="P003", first_name="Carol", last_name="Williams",
                          date_of_birth="1990-11-05", phone="+15551003003",
                          email="carol@example.com"),
        ]
        return SyncResult(
            success=True,
            records_processed=len(patients),
            records_created=len(patients),
            raw_data=[p.__dict__ for p in patients],
        )

    async def sync_appointments(self, since: Optional[str] = None) -> SyncResult:
        appointments = [
            AppointmentRecord(
                external_id="A001", patient_external_id="P001", provider_external_id="DR001",
                start_datetime="2026-07-21T09:00:00", end_datetime="2026-07-21T09:45:00",
                status="scheduled", operatory="Op-1", procedure_codes=["D0120", "D0274"],
            ),
            AppointmentRecord(
                external_id="A002", patient_external_id="P002", provider_external_id="DR001",
                start_datetime="2026-07-21T10:00:00", end_datetime="2026-07-21T11:00:00",
                status="confirmed", operatory="Op-2", procedure_codes=["D2740"],
            ),
        ]
        return SyncResult(
            success=True,
            records_processed=len(appointments),
            records_created=len(appointments),
            raw_data=[a.__dict__ for a in appointments],
        )

    async def sync_providers(self) -> SyncResult:
        providers = [
            ProviderRecord(external_id="DR001", first_name="James", last_name="Chen",
                           specialty="General Dentistry", npi="1234567890"),
            ProviderRecord(external_id="DR002", first_name="Sarah", last_name="Park",
                           specialty="Orthodontics", npi="0987654321"),
        ]
        return SyncResult(
            success=True,
            records_processed=len(providers),
            records_created=len(providers),
            raw_data=[p.__dict__ for p in providers],
        )

    async def sync_schedule(self, date_from: Optional[str] = None, date_to: Optional[str] = None) -> SyncResult:
        return SyncResult(success=True, records_processed=14, records_created=14, raw_data=[])

    async def sync_insurance(self) -> SyncResult:
        return SyncResult(success=True, records_processed=5, records_created=5, raw_data=[
            {"name": "Delta Dental", "plan_id": "DD001"},
            {"name": "MetLife", "plan_id": "ML002"},
            {"name": "Cigna", "plan_id": "CG003"},
        ])

    async def sync_procedures(self) -> SyncResult:
        return SyncResult(success=True, records_processed=10, records_created=10, raw_data=[])
