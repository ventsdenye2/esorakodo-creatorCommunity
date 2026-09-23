/** @param {string | null} value @param {string} origin */
export function safeNextPath(value, origin) {
  if (!value?.startsWith("/") || value.includes("\\")) return "/creator";
  const target = new URL(value, origin);
  return target.origin === origin ? `${target.pathname}${target.search}${target.hash}` : "/creator";
}
