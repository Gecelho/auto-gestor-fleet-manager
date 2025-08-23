import * as React from "react";
import { cn } from "@/lib/utils";
import { validateAndSanitizeInput } from "@/lib/security";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export interface SecureTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number;
  allowedChars?: RegExp;
  showSecurityIndicator?: boolean;
  onSecurityViolation?: (violations: string[]) => void;
}

const SecureTextarea = React.forwardRef<HTMLTextAreaElement, SecureTextareaProps>(
  ({ 
    className,
    maxLength,
    allowedChars,
    showSecurityIndicator = false,
    onSecurityViolation,
    onChange,
    value,
    ...props 
  }, ref) => {
    const [securityStatus, setSecurityStatus] = React.useState({
      isSecure: true,
      violations: [] as string[]
    });
    const [internalValue, setInternalValue] = React.useState(value || '');

    const handleChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      
      // Validar e sanitizar o input
      const validation = validateAndSanitizeInput(newValue, {
        maxLength,
        allowedChars,
        required: props.required
      });

      // Atualizar status de segurança
      setSecurityStatus({
        isSecure: validation.isValid,
        violations: validation.errors
      });

      // Se há violações de segurança, usar valor sanitizado
      const finalValue = validation.isValid ? newValue : validation.sanitizedValue;
      setInternalValue(finalValue);

      // Notificar sobre violações
      if (!validation.isValid) {
        if (onSecurityViolation) {
          onSecurityViolation(validation.errors);
        }
        
        // Mostrar toast apenas para violações de segurança (não validação comum)
        const hasSecurityViolations = validation.errors.some(error => 
          error.includes('malicioso') || error.includes('não permitidos')
        );
        
        if (hasSecurityViolations) {
          toast.error('Conteúdo inseguro detectado e removido.');
        }
      }

      // Criar evento com valor seguro
      const secureEvent = {
        ...event,
        target: {
          ...event.target,
          value: finalValue
        }
      };

      if (onChange) {
        onChange(secureEvent);
      }
    }, [maxLength, allowedChars, props.required, onSecurityViolation, onChange]);

    // Sincronizar valor interno com prop value
    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(String(value));
      }
    }, [value]);

    const getSecurityIcon = () => {
      if (!showSecurityIndicator) return null;
      
      if (securityStatus.isSecure) {
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      } else {
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      }
    };

    const getSecurityClasses = () => {
      if (!showSecurityIndicator) return '';
      
      return securityStatus.isSecure 
        ? 'border-green-200 focus:border-green-500' 
        : 'border-red-200 focus:border-red-500';
    };

    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            getSecurityClasses(),
            className
          )}
          ref={ref}
          value={internalValue}
          onChange={handleChange}
          {...props}
        />
        
        {showSecurityIndicator && (
          <div className="absolute right-3 top-3">
            {getSecurityIcon()}
          </div>
        )}
        
        {!securityStatus.isSecure && securityStatus.violations.length > 0 && (
          <div className="mt-1 text-xs text-red-600">
            {securityStatus.violations.map((violation, index) => (
              <div key={index}>{violation}</div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

SecureTextarea.displayName = "SecureTextarea";

export { SecureTextarea };