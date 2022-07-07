/**
 * Replaces the characters `<` and `>` with their respective HTML code.
 */
export const escapeHtmlChars = (str: string) => {
  return str.replace(/>/g, '&gt;').replace(/</g, '&lt;')
}

/**
 * Removes `;`, `'`, `"`, `&`, `<`, `>`, `{`, `}`, `[]`, `]` from the string
 */
export const removeHtmlChars = (str: string) => {
  return str.replace(/[;\'\"&<>{}[\]]/g, '')
}
