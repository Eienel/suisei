import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Suisei, the Sui agent toolkit',
  description:
    'The Sui Stack as one-line tools over the Model Context Protocol. Any AI agent can read, build, simulate, sign, and submit on Sui.',
  openGraph: {
    title: 'Suisei, the Sui agent toolkit',
    description:
      'The Sui Stack as one-line tools over MCP. Any AI agent can read, build, simulate, sign, and submit on Sui.',
    type: 'website',
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
