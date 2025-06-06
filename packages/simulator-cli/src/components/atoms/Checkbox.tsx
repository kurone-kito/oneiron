import { Text } from 'ink';

export type CheckboxProps = {
  label: string;
  checked: boolean;
};

export const Checkbox = ({ label, checked }: CheckboxProps) => (
  <Text>
    {checked ? '[x]' : '[ ]'} {label}
  </Text>
);
