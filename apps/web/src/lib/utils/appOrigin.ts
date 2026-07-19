// Sau reverse proxy, host của request.url resolve về loopback (127.0.0.1) dù Nginx forward Host đúng.
// NEXT_PUBLIC_SITE_URL cho phép app tự quyết origin của mình; fallback = origin request (dev/local không set).
export function appOrigin(fallback: string): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? fallback
}
