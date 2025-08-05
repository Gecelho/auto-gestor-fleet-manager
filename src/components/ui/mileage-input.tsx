import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatMileage, parseMileage } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export interface MileageInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string, numericValue: number) => void;
}

const MileageInput = React.forwardRef<HTMLInputElement, MileageInputProps>(
  ({ className, value = '', onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value);

    React.useEffect(() => {
      if (value !== displayValue) {
        setDisplayValue(value);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatMileage(inputValue);
      const numeric = parseMileage(formatted);
      
      setDisplayValue(formatted);
      onChange?.(formatted, numeric);
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        className={cn(className)}
        placeholder="0"
      />
    );
  }
);

MileageInput.displayName = "MileageInput";

export { MileageInput };