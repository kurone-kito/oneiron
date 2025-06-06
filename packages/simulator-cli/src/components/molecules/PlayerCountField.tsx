import { Box, Text } from 'ink';
import { NumberInput } from '../atoms/NumberInput.js';

export type PlayerCountFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export const PlayerCountField = ({
  value,
  onChange,
  onSubmit,
}: PlayerCountFieldProps) => (
  <Box flexDirection="column">
    <Text>プレイヤー数(2〜12)</Text>
    <NumberInput value={value} onChange={onChange} onSubmit={onSubmit} />
  </Box>
);
