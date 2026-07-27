import logging
import sys
import structlog
from app.core.config import settings

# Shared processors for both standard logging and structlog
shared_processors = [
    structlog.contextvars.merge_contextvars,
    structlog.stdlib.add_logger_name,
    structlog.stdlib.add_log_level,
    structlog.stdlib.PositionalArgumentsFormatter(),
    structlog.processors.TimeStamper(fmt="iso"),
    structlog.processors.StackInfoRenderer(),
    structlog.processors.format_exc_info,
    structlog.processors.UnicodeDecoder(),
]


def setup_logging():
    # Setup standard logging handler
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Base logging config
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    # Configure structlog
    structlog.configure(
        processors=shared_processors + [
            # Prepare for final output format
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Format standard logging messages
    formatter = structlog.stdlib.ProcessorFormatter(
        # Choose processor depending on environment
        processor=structlog.processors.JSONRenderer()
        if settings.ENVIRONMENT == "production"
        else structlog.dev.ConsoleRenderer(colors=True),
        foreign_pre_chain=shared_processors,
    )

    # Configure root logger handler
    for handler in logging.root.handlers:
        handler.setFormatter(formatter)

    # Silence uvicorn access/error standard handlers logs so structlog middleware does it cleaner
    logging.getLogger("uvicorn.error").handlers = []
    logging.getLogger("uvicorn.access").handlers = []
    
    # Apply level to standard loggers
    logging.getLogger("uvicorn").setLevel(log_level)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)


# Setup logger accessor
logger = structlog.get_logger()
