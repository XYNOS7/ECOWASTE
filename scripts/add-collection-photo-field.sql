
-- Add collection_photo_url field to collection_tasks table
ALTER TABLE collection_tasks 
ADD COLUMN IF NOT EXISTS collection_photo_url TEXT;

-- Update the table with a comment
COMMENT ON COLUMN collection_tasks.collection_photo_url IS 'URL of the collection completion photo uploaded by pickup agent';
