import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://suisei.vercel.app'),
  title: 'Suisei, the Sui agent toolkit',
  description:
    'The Sui Stack as one-line tools over the Model Context Protocol. Any AI agent can read, build, simulate, sign, and submit on Sui.',
  openGraph: {
    title: 'Suisei, the Sui agent toolkit',
    description:
      'The Sui Stack as one-line tools over MCP. Any AI agent can read, build, simulate, sign, and submit on Sui.',
    url: 'https://suisei.vercel.app',
    siteName: 'Suisei',
    type: 'website',
    images: [
      {
        url: '/images/og.png',
        width: 1200,
        height: 630,
        alt: 'Suisei, the Sui Stack as one-line tools.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suisei, the Sui agent toolkit',
    description:
      'The Sui Stack as one-line tools over MCP. Any AI agent can read, build, simulate, sign, and submit on Sui.',
    images: ['/images/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#f4f2ec',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="paper-grain" aria-hidden="true" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
