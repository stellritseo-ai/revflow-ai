"""
PMS Adapter Layer — Abstract connector pattern.
Each PMS (Dentrix, Open Dental, Eaglesoft) has its own adapter.
In dev mode, the MockAdapter returns realistic fake data.
In production, real adapters call the PMS REST/SOAP APIs.
"""
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import List, Optional
import random
import uuid


class TimeSlot:
    """A single available appointment slot."""
    def __init__(self, start_time: str, end_time: str, provider_name: str, slot_id: str):
        self.start_time = start_time    # ISO datetime string
        self.end_time = end_time
        self.provider_name = provider_name
        self.slot_id = slot_id

    def to_dict(self) -> dict:
        return {
            "slot_id": self.slot_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "provider_name": self.provider_name,
        }


class BookingResult:
    """Result from booking an appointment in the PMS."""
    def __init__(self, success: bool, pms_appointment_id: Optional[str], message: str):
        self.success = success
        self.pms_appointment_id = pms_appointment_id
        self.message = message


class BasePmsAdapter(ABC):
    """Abstract base class for all PMS connectors."""

    @abstractmethod
    async def get_available_slots(
        self,
        date_from: str,
        date_to: str,
        duration_minutes: int = 60,
    ) -> List[TimeSlot]:
        """Return available appointment slots between two dates."""
        ...

    @abstractmethod
    async def book_appointment(
        self,
        slot_id: str,
        patient_name: str,
        patient_phone: str,
        patient_email: Optional[str],
        treatment_type: str,
        notes: Optional[str] = None,
    ) -> BookingResult:
        """Book an appointment in the PMS and return the result."""
        ...

    @abstractmethod
    async def cancel_appointment(self, pms_appointment_id: str) -> bool:
        """Cancel an existing appointment in the PMS."""
        ...


# ─── Mock Adapter (Dev Mode) ──────────────────────────────────────────────────

PROVIDERS = ["Dr. Sarah Chen", "Dr. Michael Torres", "Dr. Emily Park", "Dr. James Wright"]
TREATMENTS = ["Cleaning", "Crown", "Root Canal", "Whitening", "Invisalign Consult", "X-Ray + Exam"]


class MockPmsAdapter(BasePmsAdapter):
    """
    Realistic mock adapter that generates fake slots and accepts bookings.
    Used in development or when pms_type = 'none'.
    """

    async def get_available_slots(
        self,
        date_from: str,
        date_to: str,
        duration_minutes: int = 60,
    ) -> List[TimeSlot]:
        """Generate realistic-looking available slots for the next 7 days."""
        slots = []
        base = datetime.fromisoformat(date_from) if date_from else datetime.now()
        end = datetime.fromisoformat(date_to) if date_to else base + timedelta(days=7)

        current = base.replace(hour=8, minute=0, second=0, microsecond=0)
        while current < end:
            # Generate 3-6 slots per day (skip lunch 12-1pm)
            hour = current.hour
            if 8 <= hour < 12 or 13 <= hour < 17:
                # ~70% chance slot is available
                if random.random() > 0.3:
                    provider = random.choice(PROVIDERS)
                    slot_end = current + timedelta(minutes=duration_minutes)
                    slots.append(TimeSlot(
                        start_time=current.isoformat(),
                        end_time=slot_end.isoformat(),
                        provider_name=provider,
                        slot_id=f"mock_slot_{uuid.uuid4().hex[:8]}",
                    ))
            # Advance by 1 hour
            current += timedelta(hours=1)
            # Skip to next day at 8am after 5pm
            if current.hour >= 17:
                current = (current + timedelta(days=1)).replace(hour=8, minute=0)

        return slots[:20]  # Cap at 20 slots

    async def book_appointment(
        self,
        slot_id: str,
        patient_name: str,
        patient_phone: str,
        patient_email: Optional[str],
        treatment_type: str,
        notes: Optional[str] = None,
    ) -> BookingResult:
        """Simulate a successful booking 90% of the time."""
        if random.random() < 0.9:
            pms_id = f"mock_appt_{uuid.uuid4().hex[:10]}"
            return BookingResult(success=True, pms_appointment_id=pms_id, message="Appointment booked successfully")
        else:
            return BookingResult(success=False, pms_appointment_id=None, message="Slot no longer available, please choose another")

    async def cancel_appointment(self, pms_appointment_id: str) -> bool:
        return True


class DentrixAdapter(BasePmsAdapter):
    """Dentrix G7 REST API adapter (production stub)."""

    async def get_available_slots(self, date_from, date_to, duration_minutes=60) -> List[TimeSlot]:
        # TODO: Implement Dentrix REST API integration
        # For now, fall back to mock
        return await MockPmsAdapter().get_available_slots(date_from, date_to, duration_minutes)

    async def book_appointment(self, slot_id, patient_name, patient_phone, patient_email, treatment_type, notes=None) -> BookingResult:
        # TODO: Implement Dentrix appointment write-back
        return await MockPmsAdapter().book_appointment(slot_id, patient_name, patient_phone, patient_email, treatment_type, notes)

    async def cancel_appointment(self, pms_appointment_id: str) -> bool:
        return True


class OpenDentalAdapter(BasePmsAdapter):
    """Open Dental REST API adapter (production stub)."""

    async def get_available_slots(self, date_from, date_to, duration_minutes=60) -> List[TimeSlot]:
        return await MockPmsAdapter().get_available_slots(date_from, date_to, duration_minutes)

    async def book_appointment(self, slot_id, patient_name, patient_phone, patient_email, treatment_type, notes=None) -> BookingResult:
        return await MockPmsAdapter().book_appointment(slot_id, patient_name, patient_phone, patient_email, treatment_type, notes)

    async def cancel_appointment(self, pms_appointment_id: str) -> bool:
        return True


class EagleSoftAdapter(BasePmsAdapter):
    """Eaglesoft REST API adapter (production stub)."""

    async def get_available_slots(self, date_from, date_to, duration_minutes=60) -> List[TimeSlot]:
        return await MockPmsAdapter().get_available_slots(date_from, date_to, duration_minutes)

    async def book_appointment(self, slot_id, patient_name, patient_phone, patient_email, treatment_type, notes=None) -> BookingResult:
        return await MockPmsAdapter().book_appointment(slot_id, patient_name, patient_phone, patient_email, treatment_type, notes)

    async def cancel_appointment(self, pms_appointment_id: str) -> bool:
        return True


# ─── Adapter Factory ──────────────────────────────────────────────────────────

def get_pms_adapter(pms_type: str) -> BasePmsAdapter:
    """Returns the correct PMS adapter based on the client's configured PMS type."""
    adapters = {
        "dentrix": DentrixAdapter,
        "open_dental": OpenDentalAdapter,
        "eaglesoft": EagleSoftAdapter,
    }
    adapter_class = adapters.get(pms_type, MockPmsAdapter)
    return adapter_class()
