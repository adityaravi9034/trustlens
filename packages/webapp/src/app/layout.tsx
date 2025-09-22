import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TrustLens - AI-Powered Content Analysis',
  description: 'Detect manipulation, bias, and deception in online content with advanced AI analysis.',
  keywords: 'AI, content analysis, manipulation detection, bias detection, deception, misinformation',
  authors: [{ name: 'TrustLens Team' }],
  creator: 'TrustLens',
  publisher: 'TrustLens',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://trustlens.ai',
    title: 'TrustLens - AI-Powered Content Analysis',
    description: 'Detect manipulation, bias, and deception in online content with advanced AI analysis.',
    siteName: 'TrustLens',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrustLens - AI-Powered Content Analysis',
    description: 'Detect manipulation, bias, and deception in online content with advanced AI analysis.',
    creator: '@trustlens',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}