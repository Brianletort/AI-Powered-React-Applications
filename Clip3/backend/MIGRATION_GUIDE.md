# Database Migration Guide

This guide explains how to run database migrations to add the new judgment fields to your AI Chat application.

## Overview

The migration adds the following fields to the `chat_logs` table:
- `judgment_score` (INTEGER) - Quality score from 1-5
- `judgment_rationale` (TEXT) - Explanation of the score
- `hallucination_flag` (BOOLEAN) - Whether response contains hallucinations
- `judgment_tokens` (INTEGER) - Tokens used for judgment
- `judgment_data` (JSON) - Full judgment response data

## Migration Methods

### Method 1: Simple Migration Script (Recommended)

Use the provided Python script for a simple, safe migration:

```bash
cd backend
python run_migration.py
```

This script will:
- ✅ Check database connectivity
- ✅ Verify the chat_logs table exists
- ✅ Check which judgment fields are already present
- ✅ Add only missing fields (safe to run multiple times)
- ✅ Use transactions for safety (rollback on error)
- ✅ Provide detailed progress feedback

### Method 2: Alembic Migration (Advanced)

For more complex scenarios, use Alembic:

```bash
cd backend

# Initialize Alembic (first time only)
alembic init alembic  # Skip if already done

# Run the migration
alembic upgrade head
```

### Method 3: Manual SQL (Expert Users)

If you prefer to run the SQL manually:

```sql
-- Add judgment fields to chat_logs table
ALTER TABLE chat_logs ADD COLUMN judgment_score INTEGER;
ALTER TABLE chat_logs ADD COLUMN judgment_rationale TEXT;
ALTER TABLE chat_logs ADD COLUMN hallucination_flag BOOLEAN;
ALTER TABLE chat_logs ADD COLUMN judgment_tokens INTEGER;
ALTER TABLE chat_logs ADD COLUMN judgment_data JSON;
```

## Pre-Migration Checklist

Before running the migration:

1. **Backup your database** (recommended)
   ```bash
   pg_dump -h localhost -U ai_chat_user ai_chat_db > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Stop the application** (optional but recommended)
   ```bash
   docker-compose down
   ```

3. **Verify environment variables**
   ```bash
   # Check your .env file has:
   DATABASE_URL=postgresql://ai_chat_user:ai_chat_password@localhost:5432/ai_chat_db
   ```

4. **Test database connectivity**
   ```bash
   psql -h localhost -U ai_chat_user -d ai_chat_db -c "SELECT COUNT(*) FROM chat_logs;"
   ```

## Running the Migration

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Run the migration script**
   ```bash
   python run_migration.py
   ```

3. **Expected output**
   ```
   🚀 Starting database migration...
   ==================================================
   🔧 Connecting to database: localhost:5432/ai_chat_db
   ✅ Database connection successful
   ✅ chat_logs table exists
   🔄 Found 0 existing judgment fields. Adding missing fields...
   ✅ Added judgment_score column
   ✅ Added judgment_rationale column
   ✅ Added hallucination_flag column
   ✅ Added judgment_tokens column
   ✅ Added judgment_data column
   ✅ Migration completed successfully!
   ✅ Verification: 5/5 judgment fields present
   ==================================================
   ✅ Migration completed successfully!
   ```

## Post-Migration Verification

After running the migration, verify it worked:

1. **Check database schema**
   ```bash
   psql -h localhost -U ai_chat_user -d ai_chat_db -c "
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'chat_logs' 
   AND column_name IN ('judgment_score', 'judgment_rationale', 'hallucination_flag', 'judgment_tokens', 'judgment_data')
   ORDER BY column_name;
   "
   ```

2. **Verify existing data is intact**
   ```bash
   psql -h localhost -U ai_chat_user -d ai_chat_db -c "
   SELECT COUNT(*) as total_records, 
          COUNT(prompt) as prompts_count,
          COUNT(response) as responses_count
   FROM chat_logs;
   "
   ```

3. **Test the application**
   ```bash
   # Start the application
   docker-compose up -d
   
   # Check logs
   docker-compose logs -f backend
   ```

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check if PostgreSQL is running
   - Verify DATABASE_URL in .env file
   - Check firewall/network settings

2. **Table doesn't exist**
   - Run the initial table creation first
   - Check if you're connecting to the right database

3. **Permission denied**
   - Ensure the database user has ALTER TABLE privileges
   - Check user permissions in PostgreSQL

4. **Migration already applied**
   - The script is safe to run multiple times
   - It will skip existing columns

### Rolling Back

If you need to rollback the migration:

```sql
-- Remove judgment fields (WARNING: This will delete data!)
ALTER TABLE chat_logs DROP COLUMN IF EXISTS judgment_score;
ALTER TABLE chat_logs DROP COLUMN IF EXISTS judgment_rationale;
ALTER TABLE chat_logs DROP COLUMN IF EXISTS hallucination_flag;
ALTER TABLE chat_logs DROP COLUMN IF EXISTS judgment_tokens;
ALTER TABLE chat_logs DROP COLUMN IF EXISTS judgment_data;
```

### Getting Help

If you encounter issues:

1. Check the error messages carefully
2. Verify your database configuration
3. Ensure you have proper permissions
4. Check PostgreSQL logs for more details

## Safety Features

The migration script includes several safety features:

- **Idempotent**: Safe to run multiple times
- **Transactional**: Uses database transactions with rollback
- **Verification**: Checks existing columns before adding
- **Non-destructive**: Only adds columns, never removes data
- **Detailed logging**: Shows exactly what's happening

## New Features After Migration

Once the migration is complete, the application will:

- ✅ Evaluate every AI response for quality (1-5 score)
- ✅ Provide rationale for each evaluation
- ✅ Detect potential hallucinations
- ✅ Track tokens used for evaluations
- ✅ Store complete evaluation data as JSON
- ✅ Display evaluation results in the chat interface

The evaluation system will automatically start working with new chat messages after the migration is complete. 