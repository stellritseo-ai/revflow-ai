"""fix pmstype enum values to use lowercase

Revision ID: c1d2e3f4a5b6
Revises: bf136d7c3f33
Create Date: 2026-07-19
"""
from alembic import op
import sqlalchemy as sa

revision = 'c1d2e3f4a5b6'
down_revision = '8759a1d06ed5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop default value first so type is not dependent on it
    op.execute("ALTER TABLE clients ALTER COLUMN pms_type DROP DEFAULT")
    
    # Change the column to varchar
    op.execute("ALTER TABLE clients ALTER COLUMN pms_type TYPE varchar(50)")

    # Normalize values to lowercase
    op.execute("""
        UPDATE clients
        SET pms_type = LOWER(pms_type)
        WHERE pms_type != LOWER(pms_type)
    """)

    # Drop type
    op.execute("DROP TYPE IF EXISTS pmstype")

    # Recreate type
    op.execute("""
        CREATE TYPE pmstype AS ENUM (
            'dentrix', 'open_dental', 'eaglesoft', 'other', 'none'
        )
    """)

    # Restore column type
    op.execute("""
        ALTER TABLE clients
        ALTER COLUMN pms_type
        TYPE pmstype USING pms_type::pmstype
    """)

    # Restore default value
    op.execute("ALTER TABLE clients ALTER COLUMN pms_type SET DEFAULT 'none'")


def downgrade() -> None:
    op.execute("ALTER TABLE clients ALTER COLUMN pms_type DROP DEFAULT")
    op.execute("ALTER TABLE clients ALTER COLUMN pms_type TYPE varchar(50)")
    op.execute("DROP TYPE IF EXISTS pmstype")
    op.execute("""
        CREATE TYPE pmstype AS ENUM (
            'DENTRIX', 'OPEN_DENTAL', 'EAGLESOFT', 'OTHER', 'NONE'
        )
    """)
    op.execute("""
        ALTER TABLE clients
        ALTER COLUMN pms_type
        TYPE pmstype USING UPPER(pms_type)::pmstype
    """)
    op.execute("ALTER TABLE clients ALTER COLUMN pms_type SET DEFAULT 'NONE'")

