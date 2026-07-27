import uuid
from typing import List
from sqlalchemy.orm import Session
from app.admin.models.admin import SupportTicket, SupportMessage

class SupportService:
    @staticmethod
    def get_all_tickets(db: Session, status: str = None) -> List[SupportTicket]:
        query = db.query(SupportTicket)
        if status:
            query = query.filter(SupportTicket.status == status)
        return query.all()

    @staticmethod
    def assign_ticket(db: Session, ticket_id: uuid.UUID, admin_user_id: str) -> SupportTicket:
        ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
        if ticket:
            ticket.assigned_to = admin_user_id
            db.commit()
        return ticket
