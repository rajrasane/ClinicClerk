/**
 * Sanitizes user input for use in Supabase PostgREST filter queries.
 * Prevents SQL/filter injection by escaping special characters.
 */

// Characters that have special meaning in PostgREST filter syntax
const POSTGREST_SPECIAL_CHARS = /[%_'"\\(),.*]/g;

/**
 * Escapes special characters in a search term for safe use in .ilike() and .or() filters.
 * @param input - The raw user input to sanitize
 * @returns Sanitized string safe for PostgREST queries
 */
export function sanitizeSearchTerm(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim and limit length to prevent DoS via oversized input
  const trimmed = input.trim().slice(0, 100);

  // Escape special PostgREST characters
  // % and _ are wildcards in LIKE/ILIKE
  // ' and " can break out of string context
  // \ is escape character
  // (), . and * have special meaning in PostgREST syntax
  return trimmed.replace(POSTGREST_SPECIAL_CHARS, (char) => {
    switch (char) {
      case '%':
        return '\\%';
      case '_':
        return '\\_';
      case "'":
        return "''"; // SQL standard escape for single quote
      case '"':
        return '\\"';
      case '\\':
        return '\\\\';
      case '(':
      case ')':
      case ',':
      case '.':
      case '*':
        return ''; // Remove these characters entirely
      default:
        return char;
    }
  });
}

/**
 * Sanitizes and splits a search query into individual terms.
 * @param input - The raw search query
 * @returns Array of sanitized search terms
 */
export function sanitizeSearchTerms(input: string): string[] {
  if (!input || typeof input !== 'string') {
    return [];
  }

  return input
    .trim()
    .split(/\s+/)
    .slice(0, 5) // Limit to 5 terms to prevent complex query attacks
    .map(sanitizeSearchTerm)
    .filter(term => term.length > 0);
}
