import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppWidget from '@/components/WhatsAppWidget';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true 
});

export const metadata: Metadata = {
  title: 'Royal Step Shoes | Genuine Leather Footwear & Peshawari Chappals',
  description: 'Pure handcrafted leather shoes in Karachi. Inspect before paying with Cash on Delivery across Pakistan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-neutral-50 text-neutral-900`}>
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <WhatsAppWidget />
      </body>
    </html>
  );
}