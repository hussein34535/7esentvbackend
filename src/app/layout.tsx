import Sidebar from '@/components/Sidebar';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '7esen Admin Panel',
  description: 'Manage your 7esen content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white h-screen flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto bg-slate-950 relative pt-16 md:pt-0">
          {children}
        </main>
      </body>
    </html>
  );
}
