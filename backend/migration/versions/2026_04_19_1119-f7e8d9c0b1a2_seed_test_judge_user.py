"""seed_test_judge_user

Test account for local/staging: test@test.com / testtest.

Revision ID: f7e8d9c0b1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-04-19 11:19:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from users.passwords import get_password_hash

revision: str = "f7e8d9c0b1a2"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

JUDGE_EMAIL = "test@test.com"
JUDGE_PASSWORD = "testtest"


def upgrade() -> None:
    password_hash = get_password_hash(JUDGE_PASSWORD)
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            INSERT INTO users (
                id, name, patronymic, surname, email, password,
                date_of_birth, role, created_at, updated_at
            )
            SELECT
                (SELECT COALESCE(MAX(u2.id), 0) + 1 FROM users u2),
                'test',
                'test',
                'test',
                :email,
                :password,
                '1990-01-01',
                'ADMIN',
                '2026-04-19T12:00:00.000000Z',
                '2026-04-19T12:00:00.000000Z'
            WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = :email)
            """
        ),
        {"email": JUDGE_EMAIL, "password": password_hash},
    )


def downgrade() -> None:
    op.execute(
        sa.text("DELETE FROM users WHERE email = :email").bindparams(email=JUDGE_EMAIL)
    )
