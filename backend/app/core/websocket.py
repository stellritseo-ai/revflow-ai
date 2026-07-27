import json
import uuid
from typing import Dict, List
from fastapi import WebSocket
import structlog

logger = structlog.get_logger()


class ConnectionManager:
    """
    Manages WebSocket connections, grouped by tenant client_id.
    Allows broadcasting real-time call events to all connected
    dashboards for a given clinic.
    """

    def __init__(self):
        # client_id (str) → list of connected WebSockets
        self._connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        if client_id not in self._connections:
            self._connections[client_id] = []
        self._connections[client_id].append(websocket)
        logger.info("WebSocket connected", client_id=client_id, total=len(self._connections[client_id]))

    def disconnect(self, websocket: WebSocket, client_id: str):
        if client_id in self._connections:
            try:
                self._connections[client_id].remove(websocket)
            except ValueError:
                pass
            if not self._connections[client_id]:
                del self._connections[client_id]
        logger.info("WebSocket disconnected", client_id=client_id)

    async def broadcast_to_tenant(self, client_id: str, event: dict):
        """Send a JSON event to all WebSocket clients connected for a tenant."""
        connections = self._connections.get(client_id, [])
        dead = []
        for ws in connections:
            try:
                await ws.send_text(json.dumps(event))
            except Exception:
                dead.append(ws)
        # Clean up broken connections
        for ws in dead:
            self.disconnect(ws, client_id)

    async def broadcast_to_all(self, event: dict):
        """Send an event to ALL connected clients (used by super_admin)."""
        for client_id in list(self._connections.keys()):
            await self.broadcast_to_tenant(client_id, event)


# Singleton instance — imported by endpoint and service layers
manager = ConnectionManager()
