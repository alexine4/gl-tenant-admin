// Stateless by design: refresh tokens are never stored server-side, so
// there's nothing here to revoke. The endpoint exists purely as a client
// contract point; the actual logout is the client discarding both tokens.
export async function POST() {
  return new Response(null, { status: 204 });
}
