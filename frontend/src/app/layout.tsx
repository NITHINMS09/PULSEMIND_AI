import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'PulseMind AI — Organizational Intelligence Platform',
    template: '%s | PulseMind AI',
  },
  description:
    'Enterprise-grade AI-powered employee feedback and organizational intelligence platform. Transform workplace culture with real-time analytics, burnout detection, and smart recommendations.',
  keywords: [
    'employee feedback',
    'organizational intelligence',
    'AI analytics',
    'burnout detection',
    'workplace wellness',
    'HR technology',
  ],
  authors: [{ name: 'PulseMind AI' }],
  openGraph: {
    title: 'PulseMind AI — Organizational Intelligence Platform',
    description: 'Where Organizational Intelligence Meets Human Empathy',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
