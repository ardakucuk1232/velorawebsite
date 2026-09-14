'use client';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
export function Choice({
  value,
  onChange,
  values,
  label,
  className = '',
}: {
  value: string;
  onChange: (s: string) => void;
  values: (string | [string, string])[];
  label: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={'erp-select ' + className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {values.map((v) => {
          const [key, text] = Array.isArray(v) ? v : [v, v];
          return (
            <SelectItem key={key} value={key}>
              {text}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
