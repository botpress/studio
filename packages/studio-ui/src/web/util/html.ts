export const escapeHtmlChars = (str: string) => {
  return str.replace(/>/g, '&gt;').replace(/</g, '&lt;')
}
