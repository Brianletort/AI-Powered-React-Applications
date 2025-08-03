"""Add judgment fields to chat_logs table

Revision ID: 001_add_judgment_fields
Revises: 
Create Date: 2025-01-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_add_judgment_fields'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add judgment fields to chat_logs table."""
    # Add judgment_score column
    op.add_column('chat_logs', sa.Column('judgment_score', sa.Integer(), nullable=True))
    
    # Add judgment_rationale column  
    op.add_column('chat_logs', sa.Column('judgment_rationale', sa.Text(), nullable=True))
    
    # Add hallucination_flag column
    op.add_column('chat_logs', sa.Column('hallucination_flag', sa.Boolean(), nullable=True))
    
    # Add judgment_tokens column
    op.add_column('chat_logs', sa.Column('judgment_tokens', sa.Integer(), nullable=True))
    
    # Add judgment_data column (JSON)
    op.add_column('chat_logs', sa.Column('judgment_data', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    """Remove judgment fields from chat_logs table."""
    op.drop_column('chat_logs', 'judgment_data')
    op.drop_column('chat_logs', 'judgment_tokens')
    op.drop_column('chat_logs', 'hallucination_flag')
    op.drop_column('chat_logs', 'judgment_rationale')
    op.drop_column('chat_logs', 'judgment_score') 