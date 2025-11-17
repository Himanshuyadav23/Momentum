import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Momentum - Productivity & Habit Tracker',
  description: 'Track your time, build habits, and manage expenses with Momentum',
  authors: [{ name: 'Himanshu Yadav', url: 'https://himanshuuyadav.netlify.app/' }],
  creator: 'Himanshu Yadav',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}



