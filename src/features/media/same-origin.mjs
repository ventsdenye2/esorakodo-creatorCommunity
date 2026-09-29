/**
 * The public origin is deployment configuration, never a forwarded request header.
 * @param {Request} request
 * @param {{production: boolean, siteUrl?: string}} options
 */
export function isSameMediaOrigin(request, { production, siteUrl }) {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  try {
    // Missing/invalid production configuration must not fall back to the Host.
    const configured = siteUrl === undefined ? null : new URL(siteUrl);
    if (configured && (!/^https?:$/.test(configured.protocol) || configured.username || configured.password || configured.pathname !== "/" || configured.search || configured.hash)) return false;
    if (production && !configured) return false;
    const expected = production ? configured : new URL(request.url);
    return Boolean(expected && /^https?:$/.test(expected.protocol) && origin === expected.origin);
  } catch {
    return false;
  }
}
