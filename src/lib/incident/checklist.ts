import type { IncidentIntake } from './schema'
import type { ChecklistItem, RegimeTriage } from './types'

/**
 * Checkliste der für eine Erstmeldung typischerweise benötigten Angaben.
 * DSGVO-Punkte nur, wenn personenbezogene Daten ja/unbekannt.
 */
export function buildChecklist(
  intake: IncidentIntake,
  relevant: RegimeTriage[],
): ChecklistItem[] {
  const items: ChecklistItem[] = [
    { id: 'what', required: true, labelKey: 'what' },
    { id: 'when', required: true, labelKey: 'when' },
    { id: 'systems', required: true, labelKey: 'systems' },
    { id: 'availability', required: true, labelKey: 'availability' },
    { id: 'contact', required: true, labelKey: 'contact' },
    { id: 'mitigation', required: true, labelKey: 'mitigation' },
    { id: 'impact', required: true, labelKey: 'impact' },
  ]

  if (intake.personal_data === 'yes' || intake.personal_data === 'unknown') {
    items.push(
      { id: 'gdpr_categories', required: intake.personal_data === 'yes', labelKey: 'gdpr_categories' },
      { id: 'gdpr_persons', required: true, labelKey: 'gdpr_persons' },
      { id: 'gdpr_dpa', required: intake.personal_data === 'yes', labelKey: 'gdpr_dpa' },
      { id: 'gdpr_subjects', required: false, labelKey: 'gdpr_subjects' },
    )
  }

  for (const r of relevant) {
    items.push({
      id: `authority_${r.regime}`,
      required: r.applicable === 'applicable',
      labelKey: 'authority_portal',
      vars: { regime: r.regime.toUpperCase(), authority: r.authority.name },
    })
  }

  items.push({ id: 'follow_up', required: false, labelKey: 'follow_up' })

  return items
}
