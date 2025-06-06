import { useApp } from 'ink';
import { PlayerSetupModal } from './components/organisms/PlayerSetupModal.js';

export const App = () => {
  const { exit } = useApp();
  const handleSubmit = (values: { playerCount: number; botMode: boolean }) => {
    console.log(JSON.stringify(values));
    exit();
  };
  return <PlayerSetupModal onSubmit={handleSubmit} />;
};
