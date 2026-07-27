from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.logger import logger


class RevFlowException(Exception):
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        meta: dict = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.meta = meta or {}


class NotFoundException(RevFlowException):
    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND", meta: dict = None):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_404_NOT_FOUND,
            meta=meta,
        )


class AuthenticationException(RevFlowException):
    def __init__(self, message: str = "Authentication failed", code: str = "UNAUTHENTICATED", meta: dict = None):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_401_UNAUTHORIZED,
            meta=meta,
        )


class AuthorizationException(RevFlowException):
    def __init__(self, message: str = "Permission denied", code: str = "UNAUTHORIZED", meta: dict = None):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_403_FORBIDDEN,
            meta=meta,
        )


class DatabaseException(RevFlowException):
    def __init__(self, message: str = "Database operation failed", code: str = "DATABASE_ERROR", meta: dict = None):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            meta=meta,
        )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RevFlowException)
    async def revflow_exception_handler(request: Request, exc: RevFlowException):
        logger.error(
            "Application error occurred",
            path=request.url.path,
            code=exc.code,
            error=exc.message,
            meta=exc.meta,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "meta": exc.meta,
                }
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.error(
            "HTTP error occurred",
            path=request.url.path,
            status_code=exc.status_code,
            error=str(exc.detail),
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": "HTTP_ERROR",
                    "message": str(exc.detail),
                    "meta": {},
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = exc.errors()
        logger.error(
            "Validation error occurred",
            path=request.url.path,
            error_count=len(errors),
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Input validation failed",
                    "meta": {"details": errors},
                }
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        import traceback
        try:
            with open("error.log", "a") as f:
                f.write(f"--- ERROR AT {request.url.path} ---\n")
                traceback.print_exc(file=f)
                f.write("\n")
        except Exception:
            pass
        logger.exception(
            "Unhandled system error",
            path=request.url.path,
            error=str(exc),
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected server error occurred",
                    "meta": {},
                }
            },
        )
