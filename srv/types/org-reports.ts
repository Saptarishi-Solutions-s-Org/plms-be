export const sourceleads = `
CASE
  WHEN source IS NULL OR source = '' THEN 'Unknown'

  WHEN source IN ('Instagram', 'Facebook', 'LinkedIn', 'WhatsApp')
    THEN 'Social Media'

  WHEN source IN ('Manual_Entry', 'manual_entry')
    THEN 'Manual Entry'

  WHEN source IN ('Advertisement', 'advertisement', 'ads', 'Google Ads')
    THEN 'Advertisement'

  WHEN source IN ('Referral', 'referral')
    THEN 'Referral'

  ELSE 'Other'
END
`;