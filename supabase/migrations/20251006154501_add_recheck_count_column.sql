/*
  # Add recheck_count column to new_questions table

  1. Changes
    - Add `recheck_count` column (integer, default 0) to track how many times a question has been rechecked
    - Update existing status column to store additional metadata if needed
  
  2. Notes
    - recheck_count starts at 0 and increments with each recheck operation
    - This allows bulk rechecking operations to be tracked
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'new_questions' AND column_name = 'recheck_count'
  ) THEN
    ALTER TABLE new_questions ADD COLUMN recheck_count integer DEFAULT 0;
  END IF;
END $$;