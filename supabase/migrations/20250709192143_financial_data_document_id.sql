-- Add document_id field to financial_data table to link records to specific documents
ALTER TABLE public.financial_data 
ADD COLUMN document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE;

-- Add index for better performance when querying by document
CREATE INDEX idx_financial_data_document_id ON public.financial_data(document_id);

-- Add index for better performance when querying by user and document
CREATE INDEX idx_financial_data_user_document ON public.financial_data(user_id, document_id);