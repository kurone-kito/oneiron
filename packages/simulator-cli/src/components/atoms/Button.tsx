import { Text } from 'ink';

export type ButtonProps = {
  label: string;
};

export const Button = ({ label }: ButtonProps) => <Text>[{label}]</Text>;
