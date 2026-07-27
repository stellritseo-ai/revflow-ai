from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import uuid
import logging

from app.revenue.models import (
    AutomationRule,
    AutomationLog,
    AutomationEventTrigger,
    AutomationAction,
    PatientProfile
)

logger = logging.getLogger(__name__)

async def trigger_automation_event(
    client_id: str,
    event_trigger: AutomationEventTrigger,
    patient_id: str,
    db: AsyncSession,
    context: dict = None
):
    """
    Called when a system event occurs (e.g. NO_SHOW, CANCELLATION).
    Finds matching active AutomationRules and executes their actions.
    """
    stmt = select(AutomationRule).where(
        and_(
            AutomationRule.client_id == uuid.UUID(client_id),
            AutomationRule.event_trigger == event_trigger,
            AutomationRule.is_active == True
        )
    )
    rules = (await db.execute(stmt)).scalars().all()
    
    if not rules:
        return
        
    for rule in rules:
        # Execute the action
        status = "success"
        details = ""
        
        try:
            if rule.action == AutomationAction.SEND_SMS:
                details = f"Simulated sending SMS to patient {patient_id} using template {rule.message_template_id}"
                # Here we would integrate with app.communication.services to actually send the SMS
            elif rule.action == AutomationAction.CREATE_TASK:
                details = f"Simulated creating a follow-up task for patient {patient_id}"
            elif rule.action == AutomationAction.AI_VOICE_CALL:
                details = f"Simulated queuing an AI Voice Call for patient {patient_id}"
        except Exception as e:
            status = "failed"
            details = str(e)
            logger.error(f"Automation Rule {rule.id} failed: {e}")
            
        # Log the action
        log_entry = AutomationLog(
            client_id=uuid.UUID(client_id),
            automation_rule_id=rule.id,
            patient_id=uuid.UUID(patient_id),
            action_taken=rule.action.value,
            status=status,
            details=details
        )
        db.add(log_entry)
        
    await db.commit()
