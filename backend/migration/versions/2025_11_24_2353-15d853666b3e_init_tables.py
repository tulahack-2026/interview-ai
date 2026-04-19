"""init_tables

Revision ID: 15d853666b3e
Revises:
Create Date: 2025-11-24 23:53:48.081163

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '15d853666b3e'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('patronymic', sa.String(length=200), nullable=False),
    sa.Column('surname', sa.String(length=200), nullable=False),
    sa.Column('email', sa.String(length=200), nullable=False),
    sa.Column('password', sa.String(length=200), nullable=False),
    sa.Column('date_of_birth', sa.String(length=200), nullable=False),
    sa.Column('role', sa.String(length=200), nullable=False),
    sa.Column('created_at', sa.String(length=200), nullable=True),
    sa.Column('updated_at', sa.String(length=200), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('users')
