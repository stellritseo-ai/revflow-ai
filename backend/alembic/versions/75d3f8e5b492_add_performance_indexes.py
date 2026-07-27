"""Add performance indexes

Revision ID: 75d3f8e5b492
Revises: f3ea12e15b48
Create Date: 2026-07-21 15:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '75d3f8e5b492'
down_revision: Union[str, Sequence[str], None] = 'f3ea12e15b48'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # calls
    op.create_index(op.f('ix_calls_from_number'), 'calls', ['from_number'], unique=False)
    op.create_index(op.f('ix_calls_status'), 'calls', ['status'], unique=False)
    
    # appointments
    op.create_index(op.f('ix_appointments_patient_phone'), 'appointments', ['patient_phone'], unique=False)
    op.create_index(op.f('ix_appointments_patient_email'), 'appointments', ['patient_email'], unique=False)
    op.create_index(op.f('ix_appointments_status'), 'appointments', ['status'], unique=False)
    op.create_index(op.f('ix_appointments_scheduled_at'), 'appointments', ['scheduled_at'], unique=False)


def downgrade() -> None:
    # appointments
    op.drop_index(op.f('ix_appointments_scheduled_at'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_status'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_patient_email'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_patient_phone'), table_name='appointments')
    
    # calls
    op.drop_index(op.f('ix_calls_status'), table_name='calls')
    op.drop_index(op.f('ix_calls_from_number'), table_name='calls')
