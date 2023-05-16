import { Inter } from 'next/font/google';
import type { FC, PropsWithChildren } from 'react';
import './globals.css';

/** The Inter font. */
const inter = Inter({ subsets: ['latin-ext'] });

/** The metadata for the application. */
export const metadata = {
  title: 'Dream Duels: The Battle for Oneiron',
  description: 'The simulator for the Dream Duels card game.',
};

/**
 * The root layout for the application.
 * @param props The props for the root layout.
 * @param props.children The children of the root layout.
 * @returns The root layout for the application.
 */
const RootLayout: FC<PropsWithChildren> = ({ children }) => (
  <html lang="en">
    <body className={inter.className}>{children}</body>
  </html>
);

export default RootLayout;
