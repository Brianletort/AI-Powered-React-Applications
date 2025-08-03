#!/usr/bin/env python3
"""
Database migration script for adding judgment fields to chat_logs table.

This script adds the new judgment fields to the existing chat_logs table
without deleting any existing data.

Usage:
    python run_migration.py
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_database_url():
    """Get database URL from environment variables."""
    return os.getenv("DATABASE_URL", "postgresql://ai_chat_user:ai_chat_password@localhost:5432/ai_chat_db")

def run_migration():
    """Run the database migration to add judgment fields."""
    
    database_url = get_database_url()
    print(f"🔧 Connecting to database: {database_url.split('@')[1] if '@' in database_url else 'localhost'}")
    
    try:
        # Create database engine
        engine = create_engine(database_url)
        
        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            
            # Check if table exists
            table_check = connection.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'chat_logs'
                );
            """))
            
            if not table_check.fetchone()[0]:
                print("❌ chat_logs table does not exist. Please create the table first.")
                return False
                
            print("✅ chat_logs table exists")
            
            # Check if judgment fields already exist
            column_check = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'chat_logs' 
                AND column_name IN ('judgment_score', 'judgment_rationale', 'hallucination_flag', 'judgment_tokens', 'judgment_data');
            """))
            
            existing_columns = [row[0] for row in column_check.fetchall()]
            
            if len(existing_columns) == 5:
                print("✅ All judgment fields already exist. No migration needed.")
                return True
                
            print(f"🔄 Found {len(existing_columns)} existing judgment fields. Adding missing fields...")
            
            # Begin transaction
            trans = connection.begin()
            
            try:
                # Add judgment_score column if it doesn't exist
                if 'judgment_score' not in existing_columns:
                    connection.execute(text("""
                        ALTER TABLE chat_logs 
                        ADD COLUMN judgment_score INTEGER;
                    """))
                    print("✅ Added judgment_score column")
                
                # Add judgment_rationale column if it doesn't exist
                if 'judgment_rationale' not in existing_columns:
                    connection.execute(text("""
                        ALTER TABLE chat_logs 
                        ADD COLUMN judgment_rationale TEXT;
                    """))
                    print("✅ Added judgment_rationale column")
                
                # Add hallucination_flag column if it doesn't exist
                if 'hallucination_flag' not in existing_columns:
                    connection.execute(text("""
                        ALTER TABLE chat_logs 
                        ADD COLUMN hallucination_flag BOOLEAN;
                    """))
                    print("✅ Added hallucination_flag column")
                
                # Add judgment_tokens column if it doesn't exist
                if 'judgment_tokens' not in existing_columns:
                    connection.execute(text("""
                        ALTER TABLE chat_logs 
                        ADD COLUMN judgment_tokens INTEGER;
                    """))
                    print("✅ Added judgment_tokens column")
                
                # Add judgment_data column if it doesn't exist
                if 'judgment_data' not in existing_columns:
                    connection.execute(text("""
                        ALTER TABLE chat_logs 
                        ADD COLUMN judgment_data JSON;
                    """))
                    print("✅ Added judgment_data column")
                
                # Commit transaction
                trans.commit()
                print("✅ Migration completed successfully!")
                
                # Verify the changes
                verify_check = connection.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'chat_logs' 
                    AND column_name IN ('judgment_score', 'judgment_rationale', 'hallucination_flag', 'judgment_tokens', 'judgment_data');
                """))
                
                final_columns = [row[0] for row in verify_check.fetchall()]
                print(f"✅ Verification: {len(final_columns)}/5 judgment fields present")
                
                return True
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Migration failed, rolled back: {e}")
                return False
                
    except SQLAlchemyError as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting database migration...")
    print("=" * 50)
    
    success = run_migration()
    
    print("=" * 50)
    if success:
        print("✅ Migration completed successfully!")
        print("You can now use the judgment fields in your application.")
        sys.exit(0)
    else:
        print("❌ Migration failed!")
        print("Please check the error messages above and try again.")
        sys.exit(1) 