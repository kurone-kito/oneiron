import { Box, Text } from 'ink';

export type LogPaneProps = {
  logs: readonly string[];
  status: string;
};

export const LogPane = ({ logs, status }: LogPaneProps) => (
  <Box flexDirection="column" marginRight={2} width={30}>
    <Text>{status}</Text>
    {logs.map((l, i) => (
      <Text key={`${i}-${l}`}>{l}</Text>
    ))}
  </Box>
);
