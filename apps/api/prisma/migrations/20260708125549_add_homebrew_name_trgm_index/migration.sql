-- Enable trigram extension for ILIKE search performance (docs/02 §3.5)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "homebrew_items_name_trgm_idx" ON "homebrew_items" USING gin ("name" gin_trgm_ops);
