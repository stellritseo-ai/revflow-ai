"""
Integration Manager — Resolves and instantiates the correct PMS provider for a given clinic.
The rest of the application only ever calls this manager — never a provider directly.
"""
from __future__ import annotations
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.integrations.models import IntegrationCredential, PMSProvider
from app.integrations.interfaces.base import BasePMSProvider, ConnectionConfig
from app.integrations.services import credential_service


def build_connection_config(cred: IntegrationCredential) -> ConnectionConfig:
    """Decrypt stored credentials and build a ConnectionConfig."""
    return ConnectionConfig(
        api_url=cred.api_url or "",
        api_key=credential_service.decrypt(cred.encrypted_api_key or ""),
        username=credential_service.decrypt(cred.encrypted_username or ""),
        password=credential_service.decrypt(cred.encrypted_password or ""),
        client_secret=credential_service.decrypt(cred.encrypted_client_secret or ""),
        refresh_token=credential_service.decrypt(cred.encrypted_refresh_token or ""),
        access_token=credential_service.decrypt(cred.encrypted_access_token or ""),
        environment=cred.environment,
    )


def get_provider_instance(cred: IntegrationCredential) -> BasePMSProvider:
    """Factory: return the right provider implementation for a credential record."""
    config = build_connection_config(cred)

    match cred.provider:
        case PMSProvider.OPEN_DENTAL:
            from app.integrations.providers.open_dental import OpenDentalProvider
            return OpenDentalProvider(config)
        case PMSProvider.DENTRIX:
            from app.integrations.providers.dentrix import DentrixProvider
            return DentrixProvider(config)
        case PMSProvider.EAGLESOFT:
            from app.integrations.providers.eaglesoft import EaglesoftProvider
            return EaglesoftProvider(config)
        case PMSProvider.CURVE_DENTAL:
            from app.integrations.providers.curve_dental import CurveDentalProvider
            return CurveDentalProvider(config)
        case PMSProvider.MOCK:
            from app.integrations.providers.mock_provider import MockPMSProvider
            return MockPMSProvider(config)
        case _:
            from app.integrations.providers.mock_provider import MockPMSProvider
            return MockPMSProvider(config)


async def get_active_credential(
    client_id: str,
    db: AsyncSession,
    provider: Optional[PMSProvider] = None,
) -> Optional[IntegrationCredential]:
    """Fetch the active credential for a clinic, optionally filtered by provider."""
    query = select(IntegrationCredential).where(
        IntegrationCredential.client_id == client_id,
        IntegrationCredential.is_active == True,
    )
    if provider:
        query = query.where(IntegrationCredential.provider == provider)
    result = await db.execute(query.limit(1))
    return result.scalar_one_or_none()


async def get_provider_for_clinic(
    client_id: str,
    db: AsyncSession,
    provider: Optional[PMSProvider] = None,
) -> Optional[BasePMSProvider]:
    """Convenience: get active credential and instantiate its provider."""
    cred = await get_active_credential(client_id, db, provider)
    if not cred:
        return None
    return get_provider_instance(cred)
