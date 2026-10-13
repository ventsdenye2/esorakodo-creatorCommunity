/** @param {string | null} value @param {string} origin */
export function safeNextPath(value, origin) {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\") || Array.from(value).some(character => character.charCodeAt(0) <= 32)) return "/creator";
  try {
    const target = new URL(value, origin);
    return target.origin === origin ? `${target.pathname}${target.search}${target.hash}` : "/creator";
  } catch { return "/creator"; }
}
