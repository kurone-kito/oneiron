import type { FC, PropsWithChildren } from 'react';
import { Footer } from '../atoms/Footer';
import { Header } from '../atoms/Header';

export const Frame: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-grow">{children}</main>
    <Footer />
  </div>
);
