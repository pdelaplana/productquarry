import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ErrorBoundary } from '@/components/error-boundary';
import { Navbar } from '@/components/navbar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/providers/auth-provider';
import { QueryProvider } from '@/lib/providers/query-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ProductQuarry - Customer Feedback Management',
  description: 'Collect and manage customer feedback for your newly launched products',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <Navbar />
              {children}
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
