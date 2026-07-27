import asyncio
from typing import Callable, Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class EventBus:
    """
    A lightweight, in-memory event bus for the Analytics Collector.
    In a distributed production environment, this would wrap Redis Pub/Sub, Kafka, or Google Cloud Pub/Sub.
    """
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, callback: Callable):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)
        logger.info(f"Subscribed to {event_type}")

    async def publish(self, event_type: str, payload: dict):
        """
        Publish an event to all subscribers asynchronously.
        """
        if event_type in self._subscribers:
            for callback in self._subscribers[event_type]:
                try:
                    # Execute callback asynchronously
                    asyncio.create_task(callback(payload))
                except Exception as e:
                    logger.error(f"Error executing callback for {event_type}: {e}")

# Global instance
bus = EventBus()
