"""add_client_config_columns

Revision ID: 8036bdb9a898
Revises: 88869a953c67
Create Date: 2026-07-19 18:05:13.086779

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8036bdb9a898'
down_revision: Union[str, Sequence[str], None] = '88869a953c67'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the pmstype enum in Postgres first
    pmstype_enum = sa.Enum(
        'dentrix', 'open_dental', 'eaglesoft', 'other', 'none',
        name='pmstype'
    )
    pmstype_enum.create(op.get_bind(), checkfirst=True)

    op.add_column('clients', sa.Column('phone_number', sa.String(length=20), nullable=True))
    op.add_column('clients', sa.Column('timezone', sa.String(length=50), server_default='America/New_York', nullable=False))
    op.add_column('clients', sa.Column('pms_type', sa.Enum('dentrix', 'open_dental', 'eaglesoft', 'other', 'none', name='pmstype', create_type=False), server_default='none', nullable=False))
    op.add_column('clients', sa.Column('ai_enabled', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('clients', sa.Column('logo_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('clients', 'logo_url')
    op.drop_column('clients', 'ai_enabled')
    op.drop_column('clients', 'pms_type')
    op.drop_column('clients', 'timezone')
    op.drop_column('clients', 'phone_number')

    # Drop the enum type after the column is removed
    pmstype_enum = sa.Enum(name='pmstype')
    pmstype_enum.drop(op.get_bind(), checkfirst=True)

