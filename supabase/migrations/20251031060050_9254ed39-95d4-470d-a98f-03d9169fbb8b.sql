-- Create conversation_documents junction table
CREATE TABLE conversation_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES quickbooks_conversations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  attached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, document_id)
);

-- Enable RLS
ALTER TABLE conversation_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_documents
CREATE POLICY "Users can view their conversation documents"
ON conversation_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quickbooks_conversations qc
    WHERE qc.id = conversation_documents.conversation_id
    AND qc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can attach documents to their conversations"
ON conversation_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quickbooks_conversations qc
    WHERE qc.id = conversation_documents.conversation_id
    AND qc.user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = conversation_documents.document_id
    AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete documents from their conversations"
ON conversation_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM quickbooks_conversations qc
    WHERE qc.id = conversation_documents.conversation_id
    AND qc.user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_conversation_documents_conversation_id ON conversation_documents(conversation_id);
CREATE INDEX idx_conversation_documents_document_id ON conversation_documents(document_id);

-- Add document_metadata column to quickbooks_messages
ALTER TABLE quickbooks_messages 
ADD COLUMN IF NOT EXISTS document_metadata JSONB DEFAULT '[]'::jsonb;