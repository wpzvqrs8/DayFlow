import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '@/context/AppContext';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'DayFlow — Personal. Private. Yours.',
  description: 'DayFlow is a premium, distraction-free, single-user workspace for daily tracking, scoring, journaling, task management, and analytics.',
  keywords: 'productivity, journal, self-tracking, analytics, dashboard, tasks',
  authors: [{ name: 'DayFlow' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg-primary text-text-primary font-sans">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
