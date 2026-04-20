import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voyager - Corporate Travel',
  description: 'B2B corporate travel booking platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
