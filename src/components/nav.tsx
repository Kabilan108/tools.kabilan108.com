'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import Link from 'next/link';

export function Nav() {
  const { user, loading } = useAuth();

  return (
    <nav className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Tools
      </Link>
      <div>
        {loading ? null : user ? (
          <a
            href="/auth/sign-out"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Sign out
          </a>
        ) : (
          <a
            href="/auth/sign-in"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Sign in
          </a>
        )}
      </div>
    </nav>
  );
}
