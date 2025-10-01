-- Add signature_hash column to evidence_items table
ALTER TABLE public.evidence_items 
ADD COLUMN signature_hash TEXT;

-- Add index for signature_hash for better query performance
CREATE INDEX idx_evidence_signature_hash ON public.evidence_items(signature_hash);

-- Add comment to explain the column
COMMENT ON COLUMN public.evidence_items.signature_hash IS 'SHA-256 hash of the client signature for integrity verification';
