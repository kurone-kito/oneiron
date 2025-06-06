import { Box } from 'ink';
import { useInput } from 'ink';
import { useCallback, useState } from 'react';
import { clamp } from '../../utils/clamp.mjs';
import { BotModeField } from '../molecules/BotModeField.js';
import { PlayerCountField } from '../molecules/PlayerCountField.js';
import { SubmitHint } from '../molecules/SubmitHint.js';

export type PlayerSetupModalProps = {
  onSubmit: (value: { playerCount: number; botMode: boolean }) => void;
};

export const PlayerSetupModal = ({ onSubmit }: PlayerSetupModalProps) => {
  const [value, setValue] = useState('6');
  const handleSubmit = useCallback(() => {
    const count = clamp(2, 12, Number(value));
    onSubmit({ playerCount: count, botMode: true });
  }, [value, onSubmit]);

  useInput((_input, key) => {
    if (key.return) {
      handleSubmit();
    }
  });

  return (
    <Box flexDirection="column">
      <PlayerCountField
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
      />
      <BotModeField />
      <SubmitHint />
    </Box>
  );
};
