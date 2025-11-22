"""Initial migration with all tables and FTS5 search

Revision ID: 001
Revises: 
Create Date: 2025-01-28 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create all tables and FTS5 search infrastructure."""
    
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.Column('updated_at', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    
    # Create study_books table
    op.create_table('study_books',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.Column('updated_at', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_study_books_user_id', 'study_books', ['user_id'])
    
    # Create questions table
    op.create_table('questions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('study_book_id', sa.String(), nullable=False),
        sa.Column('language', sa.String(length=50), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('difficulty', sa.String(length=20), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.Column('updated_at', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['study_book_id'], ['study_books.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_questions_study_book_id', 'questions', ['study_book_id'])
    
    # Create typing_logs table
    op.create_table('typing_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('question_id', sa.String(), nullable=True),
        sa.Column('wpm', sa.Integer(), nullable=False),
        sa.Column('accuracy', sa.Float(), nullable=False),
        sa.Column('took_ms', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_typing_logs_user_id', 'typing_logs', ['user_id'])
    op.create_index('idx_typing_logs_question_id', 'typing_logs', ['question_id'])
    
    # Create learning_events table
    op.create_table('learning_events',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('app_id', sa.String(length=100), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('object_id', sa.String(length=100), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('occurred_at', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_learning_events_user_occurred', 'learning_events', ['user_id', 'occurred_at'])
    
    # Create FTS5 virtual table for search
    op.execute("""
        CREATE VIRTUAL TABLE questions_fts USING fts5(
            question_id UNINDEXED,
            question,
            answer,
            content='questions',
            content_rowid='rowid'
        )
    """)
    
    # Create triggers to maintain FTS5 sync
    op.execute("""
        CREATE TRIGGER questions_fts_insert AFTER INSERT ON questions BEGIN
            INSERT INTO questions_fts(question_id, question, answer) 
            VALUES (new.id, new.question, new.answer);
        END
    """)
    
    op.execute("""
        CREATE TRIGGER questions_fts_update AFTER UPDATE ON questions BEGIN
            UPDATE questions_fts SET question = new.question, answer = new.answer 
            WHERE question_id = new.id;
        END
    """)
    
    op.execute("""
        CREATE TRIGGER questions_fts_delete AFTER DELETE ON questions BEGIN
            DELETE FROM questions_fts WHERE question_id = old.id;
        END
    """)


def downgrade() -> None:
    """Drop all tables and FTS5 search infrastructure."""
    
    # Drop triggers first
    op.execute("DROP TRIGGER IF EXISTS questions_fts_delete")
    op.execute("DROP TRIGGER IF EXISTS questions_fts_update")
    op.execute("DROP TRIGGER IF EXISTS questions_fts_insert")
    
    # Drop FTS5 virtual table
    op.execute("DROP TABLE IF EXISTS questions_fts")
    
    # Drop tables in reverse order of creation
    op.drop_index('idx_learning_events_user_occurred', table_name='learning_events')
    op.drop_table('learning_events')
    
    op.drop_index('idx_typing_logs_question_id', table_name='typing_logs')
    op.drop_index('idx_typing_logs_user_id', table_name='typing_logs')
    op.drop_table('typing_logs')
    
    op.drop_index('idx_questions_study_book_id', table_name='questions')
    op.drop_table('questions')
    
    op.drop_index('idx_study_books_user_id', table_name='study_books')
    op.drop_table('study_books')
    
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')