import { buildPublicWikiFeed } from '../../../../src/features/wiki/public-feed';

export const dynamic = 'force-dynamic';
const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
export async function GET() {
  try { return Response.json(await buildPublicWikiFeed(), { headers }); }
  catch { return Response.json({ error: '百科暂时无法更新，请稍后重试。' }, { status: 503, headers }); }
}
