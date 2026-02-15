'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';

export function StatusBar(): React.ReactElement {
  const { user, loading } = useAuth();

  return (
    <div className="flex shrink-0 items-center justify-between border-t border-border-focus bg-surface px-4 py-1.5 text-sm text-muted">
      <span>session: {loading ? '...' : user ? user.email : 'guest'}</span>
      <span>
        {loading ? null : user ? (
          <a
            href="/auth/sign-out"
            className="text-muted transition-colors hover:text-foreground"
          >
            sign out
          </a>
        ) : (
          <a
            href="/auth/sign-in"
            className="text-muted transition-colors hover:text-foreground"
          >
            sign in
          </a>
        )}
      </span>
    </div>
  );
}
