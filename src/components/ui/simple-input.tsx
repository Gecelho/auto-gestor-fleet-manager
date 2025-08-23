import React, { forwardRef } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { cn } from '@/lib/utils';

interface SimpleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  multiline?: boolean;
  rows?: number;
}

export const SimpleInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, SimpleInputProps>(
  ({ multiline = false, rows = 3, className, ...props }, ref) => {
    if (multiline) {
      const { 
        multiline: _multiline, 
        rows: _rows,
        ...textareaProps 
      } = props as any;
      
      return (
        <Textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          rows={rows}
          className={className}
          {...textareaProps}
        />
      );
    }

    const { 
      multiline: _multiline, 
      rows: _rows,
      ...inputProps 
    } = props;

    return (
      <Input
        ref={ref as React.Ref<HTMLInputElement>}
        className={className}
        {...inputProps}
      />
    );
  }
);

SimpleInput.displayName = 'SimpleInput';

export default SimpleInput;