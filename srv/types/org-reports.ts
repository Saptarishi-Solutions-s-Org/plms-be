export const sourceleads = `
  CASE
    WHEN source IS NULL OR source = '' THEN 'Unknown'
    WHEN source = 'Socil_Media' THEN 'Social Media'
    WHEN source = 'Manual_Entry' THEN 'Manual Entry'
    ELSE REPLACE(source, '_', ' ')
  END
`;