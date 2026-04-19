"""interview_tables

Revision ID: a1b2c3d4e5f6
Revises: 15d853666b3e
Create Date: 2026-04-18 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "15d853666b3e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "interview_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("track", sa.String(length=50), nullable=False),
        sa.Column("level", sa.String(length=50), nullable=False),
        sa.Column("mode", sa.String(length=50), nullable=False),
        sa.Column("stress", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("max_turns", sa.Integer(), nullable=False),
        sa.Column("extra_metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.String(length=200), nullable=True),
        sa.Column("completed_at", sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_interview_sessions_user_id", "interview_sessions", ["user_id"], unique=False
    )

    op.create_table(
        "interview_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("raw_llm_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_interview_messages_session_id",
        "interview_messages",
        ["session_id"],
        unique=False,
    )

    op.create_table(
        "interview_reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("scores", sa.JSON(), nullable=False),
        sa.Column("recommendations", sa.JSON(), nullable=False),
        sa.Column("weak_areas", sa.JSON(), nullable=False),
        sa.Column("study_plan", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id"),
    )


def downgrade() -> None:
    op.drop_table("interview_reports")
    op.drop_index("ix_interview_messages_session_id", table_name="interview_messages")
    op.drop_table("interview_messages")
    op.drop_index("ix_interview_sessions_user_id", table_name="interview_sessions")
    op.drop_table("interview_sessions")
