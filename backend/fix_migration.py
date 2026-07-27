import re

file_path = '/Users/jitensony/reactwebsite/rev-flow/backend/alembic/versions/39421241c701_tenant_architecture.py'
with open(file_path, 'r') as f:
    content = f.read()

# Replace the uuid column to have a server_default temporarily
content = content.replace(
    "op.add_column('clients', sa.Column('uuid', sa.String(length=36), nullable=False))",
    "op.add_column('clients', sa.Column('uuid', sa.String(length=36), server_default=sa.text(\"gen_random_uuid()::text\"), nullable=False))"
)

# Fix name -> clinic_name
content = content.replace(
    "op.add_column('clients', sa.Column('clinic_name', sa.String(length=255), nullable=False))",
    "op.alter_column('clients', 'name', new_column_name='clinic_name')"
)
content = content.replace("op.drop_column('clients', 'name')", "")

# Fix subdomain -> slug
content = content.replace(
    "op.add_column('clients', sa.Column('slug', sa.String(length=100), nullable=False))",
    "op.alter_column('clients', 'subdomain', new_column_name='slug')"
)
content = content.replace("op.drop_column('clients', 'subdomain')", "")

# Fix is_active -> active
content = content.replace(
    "op.add_column('clients', sa.Column('active', sa.Boolean(), nullable=False))",
    "op.alter_column('clients', 'is_active', new_column_name='active')"
)
content = content.replace("op.drop_column('clients', 'is_active')", "")

# Add defaults to new NOT NULL columns in clients
content = content.replace(
    "op.add_column('clients', sa.Column('currency', sa.String(length=10), nullable=False))",
    "op.add_column('clients', sa.Column('currency', sa.String(length=10), server_default='USD', nullable=False))"
)
content = content.replace(
    "op.add_column('clients', sa.Column('country', sa.String(length=50), nullable=False))",
    "op.add_column('clients', sa.Column('country', sa.String(length=50), server_default='US', nullable=False))"
)
content = content.replace(
    "op.add_column('clients', sa.Column('subscription_plan', sa.String(length=50), nullable=False))",
    "op.add_column('clients', sa.Column('subscription_plan', sa.String(length=50), server_default='free', nullable=False))"
)
content = content.replace(
    "op.add_column('clients', sa.Column('subscription_status', sa.String(length=50), nullable=False))",
    "op.add_column('clients', sa.Column('subscription_status', sa.String(length=50), server_default='active', nullable=False))"
)
content = content.replace(
    "op.add_column('clients', sa.Column('max_users', sa.Integer(), nullable=False))",
    "op.add_column('clients', sa.Column('max_users', sa.Integer(), server_default='5', nullable=False))"
)
content = content.replace(
    "op.add_column('clients', sa.Column('max_locations', sa.Integer(), nullable=False))",
    "op.add_column('clients', sa.Column('max_locations', sa.Integer(), server_default='1', nullable=False))"
)

with open(file_path, 'w') as f:
    f.write(content)
print("Migration script patched!")
