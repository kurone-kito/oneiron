import type { FC } from 'react';
import { Footer } from '../components/atoms/Footer';

/**
 * The home page.
 * @returns The home page.
 */
const Home: FC = () => (
  <div className="flex min-w-screen min-h-screen flex-col">
    <main className="flex-grow text-center">Hello, World!</main>
    <Footer />
  </div>
);

export default Home;
