import type { Component } from 'solid-js';
import { Counter } from '../components/organisms/Counter';

/**
 * The top page.
 * @returns The component.
 */
const Index: Component = () => (
  <>
    <h1 class="bg-primary text-primary-content">こんにちは世界！</h1>
    <Counter />
  </>
);

export default Index;
