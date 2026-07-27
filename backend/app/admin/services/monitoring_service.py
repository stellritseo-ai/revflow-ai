import psutil
import datetime
from sqlalchemy.orm import Session
from app.admin.models.admin import SystemHealth

class MonitoringService:
    @staticmethod
    def log_system_health(db: Session):
        cpu = psutil.cpu_percent()
        ram = psutil.virtual_memory().percent
        
        health_log = SystemHealth(
            cpu_usage=cpu,
            ram_usage=ram,
            service_status={"database": "healthy", "redis": "healthy"}
        )
        db.add(health_log)
        db.commit()
        
    @staticmethod
    def get_latest_health(db: Session) -> SystemHealth:
        return db.query(SystemHealth).order_by(SystemHealth.timestamp.desc()).first()
