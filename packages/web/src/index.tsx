import { render } from 'solid-js/web';
import './styles/tokens.css';
import './styles/components.css';
import './screens/setup-screen.css';
import './screens/gameplay-screen.css';
import { App } from './App.tsx';

const root = document.getElementById('root');
if (root) render(() => <App />, root);
