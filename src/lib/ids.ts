// IDs for stored records (CLAUDE.md: never crypto.randomUUID, which is
// missing on plain-HTTP origins).

/**
 * A message is sent at most once per subject and kind (ARCHITECTURE.md
 * section 15), so the pair is the id: "consult:R-GLU-02:c1".
 */
export function messageId(kind: string, subjectKey: string): string {
  return `${kind}:${subjectKey}`
}
