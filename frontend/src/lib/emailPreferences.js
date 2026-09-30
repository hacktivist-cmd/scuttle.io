export const EMAIL_FREQUENCIES = [
  { value: 'instant', label: 'Instant', description: 'Email me as soon as something matches my interests' },
  { value: 'daily', label: 'Daily Digest', description: 'One summary email per day at 8 AM' },
  { value: 'weekly', label: 'Weekly Digest', description: 'One summary email every Monday at 8 AM' },
  { value: 'off', label: 'Off', description: "Don't email me" },
]

export function getFrequencyLabel(value) {
  return EMAIL_FREQUENCIES.find((f) => f.value === value)?.label || 'Instant'
}
