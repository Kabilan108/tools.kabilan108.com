import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
      <div className="rounded-lg border border-border bg-card px-8 py-12 text-center shadow-sm">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-lg text-muted">Page not found</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
