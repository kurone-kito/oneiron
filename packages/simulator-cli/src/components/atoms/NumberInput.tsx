import TextInput from 'ink-text-input';
import { useCallback } from 'react';

export type NumberInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export const NumberInput = ({
  value,
  onChange,
  onSubmit,
}: NumberInputProps) => {
  const handleChange = useCallback(
    (v: string) => onChange(v.replace(/\D/g, '')),
    [onChange],
  );
  return (
    <TextInput value={value} onChange={handleChange} onSubmit={onSubmit} />
  );
};
