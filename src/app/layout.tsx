import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CEO Executive Dashboard | Iconic Founders Group',
  description: 'Executive dashboard for Kory — daily briefings, priorities, meetings, and team activity at a glance.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ background: '#2e2e2e', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
