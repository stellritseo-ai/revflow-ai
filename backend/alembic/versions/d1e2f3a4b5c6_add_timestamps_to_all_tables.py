"""Add created_at and updated_at timestamps to all tables missing them

Revision ID: d1e2f3a4b5c6
Revises: c1d2e3f4a5b7
Create Date: 2026-07-20
"""
from alembic import op
import sqlalchemy as sa

revision = 'd1e2f3a4b5c6'
down_revision = 'c1d2e3f4a5b7'
branch_labels = None
depends_on = None

# Tables that were created without the Base timestamps
TABLES_NEEDING_TIMESTAMPS = [
    'user_sessions',
    'password_resets',
    'email_verifications',
    'roles',
    'permissions',
    'role_permissions',
    'user_roles',
]


def upgrade() -> None:
    for table in TABLES_NEEDING_TIMESTAMPS:
        # Check if columns already exist before adding (idempotent)
        conn = op.get_bind()
        inspector = sa.inspect(conn)
        existing_cols = [col['name'] for col in inspector.get_columns(table)]

        if 'created_at' not in existing_cols:
            op.add_column(
                table,
                sa.Column(
                    'created_at',
                    sa.DateTime(timezone=True),
                    server_default=sa.text('now()'),
                    nullable=False,
                )
            )

        if 'updated_at' not in existing_cols:
            op.add_column(
                table,
                sa.Column(
                    'updated_at',
                    sa.DateTime(timezone=True),
                    server_default=sa.text('now()'),
                    nullable=False,
                )
            )


def downgrade() -> None:
    for table in TABLES_NEEDING_TIMESTAMPS:
        conn = op.get_bind()
        inspector = sa.inspect(conn)
        existing_cols = [col['name'] for col in inspector.get_columns(table)]

        if 'updated_at' in existing_cols:
            op.drop_column(table, 'updated_at')
        if 'created_at' in existing_cols:
            op.drop_column(table, 'created_at')
