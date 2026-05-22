import { render } from 'solid-js/web';
import './styles/tokens.css';
import './screens/setup-screen.css';
import { App } from './App.tsx';

const root = document.getElementById('root');
if (root) render(() => <App />, root);
