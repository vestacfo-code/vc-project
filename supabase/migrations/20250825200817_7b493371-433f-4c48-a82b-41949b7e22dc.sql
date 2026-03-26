-- Add markdown_content column to documents table to store CSV markdown content
ALTER TABLE documents ADD COLUMN markdown_content TEXT;