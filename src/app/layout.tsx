import { withAuth } from '@workos-inc/authkit-nextjs';
import { AuthKitProvider } from '@workos-inc/authkit-nextjs/components';
import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import { StatusBar } from '@/components/status-bar';
import './globals.css';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tools',
  description: 'A collection of useful tools',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { accessToken: _, ...initialAuth } = await withAuth();
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} flex h-screen flex-col overflow-hidden font-mono antialiased`}
      >
        <AuthKitProvider initialAuth={initialAuth}>
          <div className="flex h-full flex-col">
            <div className="flex h-full flex-col border-x border-border-focus">
              {/* Title bar */}
              <div className="flex shrink-0 items-center justify-between border-b border-border-focus bg-surface px-4 py-1.5 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <span className="text-success">●</span>
                  <span>tools.kabilan108.com — bash</span>
                </div>
                <div className="flex gap-3 text-subtle">
                  <span>─</span>
                  <span>□</span>
                  <span className="text-muted">×</span>
                </div>
              </div>

              {/* Terminal body */}
              <main className="flex-1 overflow-auto">{children}</main>

              {/* Status bar */}
              <StatusBar />
            </div>
          </div>
        </AuthKitProvider>
      </body>
    </html>
  );
}
