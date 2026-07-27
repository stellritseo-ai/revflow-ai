"""auth and rbac schema setup

Revision ID: c1d2e3f4a5b7
Revises: c1d2e3f4a5b6
Create Date: 2026-07-19
"""
from alembic import op
import sqlalchemy as sa
import uuid

revision = 'c1d2e3f4a5b7'
down_revision = 'c1d2e3f4a5b6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create RBAC tables
    op.create_table(
        'roles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_roles_name'), 'roles', ['name'], unique=True)

    op.create_table(
        'permissions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_permissions_name'), 'permissions', ['name'], unique=True)

    op.create_table(
        'role_permissions',
        sa.Column('role_id', sa.UUID(), nullable=False),
        sa.Column('permission_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('role_id', 'permission_id')
    )

    op.create_table(
        'user_roles',
        sa.Column('user_id', sa.String(length=128), nullable=False),
        sa.Column('role_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'role_id')
    )

    # 2. Create Security token and session tracking tables
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.String(length=128), nullable=False),
        sa.Column('refresh_token', sa.String(length=500), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('device_info', sa.String(length=200), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('last_active', sa.String(length=50), nullable=False),
        sa.Column('expires_at', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_sessions_refresh_token'), 'user_sessions', ['refresh_token'], unique=True)
    op.create_index(op.f('ix_user_sessions_user_id'), 'user_sessions', ['user_id'], unique=False)

    op.create_table(
        'password_resets',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.String(length=128), nullable=False),
        sa.Column('token', sa.String(length=128), nullable=False),
        sa.Column('expires_at', sa.String(length=50), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_password_resets_token'), 'password_resets', ['token'], unique=True)
    op.create_index(op.f('ix_password_resets_user_id'), 'password_resets', ['user_id'], unique=False)

    op.create_table(
        'email_verifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.String(length=128), nullable=False),
        sa.Column('token', sa.String(length=128), nullable=False),
        sa.Column('expires_at', sa.String(length=50), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_verifications_token'), 'email_verifications', ['token'], unique=True)
    op.create_index(op.f('ix_email_verifications_user_id'), 'email_verifications', ['user_id'], unique=False)

    # 3. Add columns to users table
    op.add_column('users', sa.Column('hashed_password', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('is_suspended', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('locked_until', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('two_factor_secret', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('two_factor_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('phone', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('department', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('last_login', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('language', sa.String(length=10), nullable=False, server_default='en'))
    op.add_column('users', sa.Column('timezone', sa.String(length=50), nullable=False, server_default='America/New_York'))
    op.add_column('users', sa.Column('avatar_url', sa.String(length=500), nullable=True))

    # 4. Seed initial permissions and roles
    # Since operations are running raw SQL, let's inject default data safely
    # Insert permissions
    permissions_seed = [
        ('view_dashboard', 'Allows viewing dashboard and overall metrics'),
        ('manage_users', 'Allows inviting, editing, suspending, and deleting users'),
        ('manage_patients', 'Allows full access to patients CRM records'),
        ('manage_appointments', 'Allows scheduling and confirming clinic bookings'),
        ('manage_ai', 'Allows configuring AI engines and speech credentials'),
        ('manage_billing', 'Allows profile and Stripe billing setup'),
        ('view_reports', 'Allows exporting reports and analytical data'),
        ('manage_clinic_settings', 'Allows changing practice hours, PMSType config')
    ]
    
    for perm_name, desc in permissions_seed:
        op.execute(f"INSERT INTO permissions (id, name, description) VALUES ('{uuid.uuid4()}', '{perm_name}', '{desc}')")

    # Insert roles
    roles_seed = [
        ('super_admin', 'Full platform administrative access'),
        ('clinic_owner', 'Full clinic owner administrative access'),
        ('receptionist', 'Clinic reception and scheduling desk'),
        ('doctor', 'Clinic provider and clinical notes editor'),
        ('office_manager', 'Office lead administrative role'),
        ('marketing', 'Campaign and patient outreach manager'),
        ('billing', 'Billing, checkout, and insurance controller'),
        ('viewer', 'ReadOnly dashboard viewer')
    ]

    for role_name, desc in roles_seed:
        op.execute(f"INSERT INTO roles (id, name, description) VALUES ('{uuid.uuid4()}', '{role_name}', '{desc}')")

    # Bind permissions to clinic_owner role (all permissions)
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p
        WHERE r.name = 'clinic_owner'
    """)

    # Bind receptionist permissions
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p
        WHERE r.name = 'receptionist'
        AND p.name IN ('view_dashboard', 'manage_patients', 'manage_appointments', 'view_reports')
    """)

    # Bind viewer permissions
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p
        WHERE r.name = 'viewer'
        AND p.name IN ('view_dashboard', 'view_reports')
    """)


def downgrade() -> None:
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'timezone')
    op.drop_column('users', 'language')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'department')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'two_factor_enabled')
    op.drop_column('users', 'two_factor_secret')
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'failed_login_attempts')
    op.drop_column('users', 'is_suspended')
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'hashed_password')

    op.drop_table('email_verifications')
    op.drop_table('password_resets')
    op.drop_table('user_sessions')
    op.drop_table('user_roles')
    op.drop_table('role_permissions')
    op.drop_table('permissions')
    op.drop_table('roles')
