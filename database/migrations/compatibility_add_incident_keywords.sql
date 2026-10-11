-- The current incident form stores Gemini-extracted keywords as JSON text.
-- Existing records remain intact and can have NULL until they are edited.
ALTER TABLE incidents
  ADD COLUMN keywords TEXT DEFAULT NULL AFTER classification;
