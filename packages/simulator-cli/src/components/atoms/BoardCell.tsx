import { Text } from 'ink';

export type BoardCellProps = {
  symbol: string;
};

export const BoardCell = ({ symbol }: BoardCellProps) => <Text>{symbol}</Text>;
