import pytest
import os
import uuid
from httpx import AsyncClient, ASGITransport
from unittest.mock import MagicMock

# Set test environment variables before importing app
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["REDIS_URL"] = "redis://localhost:6379/1"
os.environ["HAS_OBSERVABILITY"] = "False"
os.environ["JWT_SECRET_KEY"] = "super-secret-test-key"

from app.main import app
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User, UserRole


class MockSession:
    async def execute(self, *args, **kwargs):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalars().all.return_value = []
        return mock_result
    
    def add(self, *args, **kwargs): pass
    async def commit(self): pass
    async def refresh(self, *args, **kwargs): pass
    async def rollback(self): pass
    async def close(self): pass

async def override_get_db():
    yield MockSession()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def mock_user():
    return User(
        id="test-user-id",
        email="test@example.com",
        role=UserRole.CLINIC_OWNER,
        client_id=uuid.uuid4(),
        is_active=True
    )

@pytest.fixture
def auth_client(mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")

@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"
