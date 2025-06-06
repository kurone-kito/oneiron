import { Box, Text } from 'ink';
import { Button } from '../atoms/Button.js';

export const SubmitHint = () => (
  <Box marginTop={1}>
    <Button label="決定" />
    <Text> Enterで閉じます</Text>
  </Box>
);
