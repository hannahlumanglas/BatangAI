-- Add the field used by the production incident API.
-- Run once against the BatangAI database before deploying code that reads/writes it.
ALTER TABLE incidents
  ADD COLUMN troubleshooting TEXT NULL;

-- Preserve the existing split troubleshooting content in the unified field.
UPDATE incidents
SET troubleshooting = CONCAT_WS(
  '\n\n',
  NULLIF(TRIM(basicTroubleshootingChecklist), ''),
  CASE
    WHEN NULLIF(TRIM(technicalTroubleshootingSuggestions), '') IS NULL THEN NULL
    ELSE CONCAT(
      'IT Troubleshooting Suggestions:\n',
      TRIM(technicalTroubleshootingSuggestions)
    )
  END
)
WHERE troubleshooting IS NULL OR troubleshooting = '';
