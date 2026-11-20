"""Add authentication fields to users table

Revision ID: 0002_user_auth
Revises: 0001_initial_schema
Create Date: 2026-11-17 23:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0002_user_auth'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make phone nullable so users can register with email first
    op.alter_column('users', 'phone', existing_type=sa.String(length=32), nullable=True)

    # Add email, password_hash, role, reset_token, reset_token_expires_at
    op.add_column('users', sa.Column('email', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=False, server_default=''))
    op.add_column('users', sa.Column('role', sa.String(length=64), nullable=False, server_default='user'))
    op.add_column('users', sa.Column('reset_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('reset_token_expires_at', sa.DateTime(), nullable=True))

    op.create_index('idx_users_email', 'users', ['email'], unique=True)
    op.create_index('idx_users_reset_token', 'users', ['reset_token'])


def downgrade() -> None:
    op.drop_index('idx_users_reset_token', table_name='users')
    op.drop_index('idx_users_email', table_name='users')
    op.drop_column('users', 'reset_token_expires_at')
    op.drop_column('users', 'reset_token')
    op.drop_column('users', 'role')
    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'email')
    op.alter_column('users', 'phone', existing_type=sa.String(length=32), nullable=False)

