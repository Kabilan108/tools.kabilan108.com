import { withAuth } from '@workos-inc/authkit-nextjs';
import { AuthKitProvider } from '@workos-inc/authkit-nextjs/components';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Nav } from '@/components/nav';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AuthKitProvider initialAuth={initialAuth}>
          <Nav />
          <main>{children}</main>
        </AuthKitProvider>
      </body>
    </html>
  );
}
