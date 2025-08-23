/**
 * Componente de Input Seguro
 * Implementa validação e sanitização que não pode ser contornada pelo cliente
 */

import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { cn } from '@/lib/utils';
import { advancedInputValidation, SecurityLogger, rateLimiter } from '@/lib/security';
import { recordSecurityViolation, isUserBlocked } from '@/lib/security-audit';
import { AlertTriangle, Shield, ShieldCheck, ShieldX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SecureInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string, isValid: boolean) => void;
  onSecurityViolation?: (violations: string[]) => void;
  fieldType?: 'text' | 'email' | 'url' | 'numeric' | 'alphanumeric' | 'description';
  maxLength?: number;
  minLength?: number;
  strictMode?: boolean;
  showSecurityIndicator?: boolean;
  allowedChars?: RegExp;
  blockedPatterns?: RegExp[];
  variant?: 'input' | 'textarea';
  multiline?: boolean; // Add multiline prop
  rows?: number;
  realTimeValidation?: boolean;
  rateLimitKey?: string;
}

export const SecureInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, SecureInputProps>(
  ({
    value = '',
    onChange,
    onSecurityViolation,
    fieldType = 'text',
    maxLength,
    minLength,
    strictMode = false,
    showSecurityIndicator = false,
    allowedChars,
    blockedPatterns,
    variant = 'input',
    multiline = false,
    rows = 3,
    realTimeValidation = true,
    rateLimitKey,
    className,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value);
    const [securityLevel, setSecurityLevel] = useState<'safe' | 'suspicious' | 'dangerous'>('safe');
    const [errors, setErrors] = useState<string[]>([]);
    const [isValid, setIsValid] = useState(true);
    const [lastValidationTime, setLastValidationTime] = useState(0);

    // Função de validação com rate limiting
    const validateInput = useCallback((inputValue: string) => {
      const now = Date.now();
      
      // Rate limiting para prevenir spam de validações
      if (rateLimitKey && !rateLimiter.isAllowed(rateLimitKey, 100, 60000)) {
        SecurityLogger.log('warning', 'rate_limit_exceeded', {
          key: rateLimitKey,
          value: inputValue.substring(0, 50) + '...'
        });
        return;
      }

      // Throttling de validação (máximo 1 validação por 100ms)
      if (now - lastValidationTime < 100) {
        return;
      }
      setLastValidationTime(now);

      const validation = advancedInputValidation(inputValue, {
        maxLength,
        minLength,
        fieldType,
        strictMode,
        allowedChars,
        blockedPatterns
      });

      setSecurityLevel(validation.securityLevel);
      setErrors(validation.errors);
      setIsValid(validation.isValid);

      // Log de segurança
      if (validation.securityLevel === 'dangerous') {
        SecurityLogger.log('critical', 'malicious_input_detected', {
          fieldType,
          originalValue: inputValue.substring(0, 100),
          sanitizedValue: validation.sanitizedValue.substring(0, 100),
          errors: validation.errors
        });
        
        if (onSecurityViolation) {
          onSecurityViolation(validation.errors);
        }
      } else if (validation.securityLevel === 'suspicious') {
        SecurityLogger.log('warning', 'suspicious_input_detected', {
          fieldType,
          value: inputValue.substring(0, 100),
          errors: validation.errors
        });
      }

      // Sempre usar o valor sanitizado
      const sanitizedValue = validation.sanitizedValue;
      
      // Atualizar valor interno apenas se mudou
      if (sanitizedValue !== internalValue) {
        setInternalValue(sanitizedValue);
      }

      // Chamar onChange com valor sanitizado
      if (onChange) {
        onChange(sanitizedValue, validation.isValid);
      }

      return validation;
    }, [
      maxLength,
      minLength,
      fieldType,
      strictMode,
      allowedChars,
      blockedPatterns,
      rateLimitKey,
      lastValidationTime,
      internalValue,
      onChange,
      onSecurityViolation
    ]);

    // Validação em tempo real
    useEffect(() => {
      if (realTimeValidation && internalValue !== value) {
        const timeoutId = setTimeout(() => {
          validateInput(internalValue);
        }, 300); // Debounce de 300ms

        return () => clearTimeout(timeoutId);
      }
    }, [internalValue, realTimeValidation, validateInput, value]);

    // Sincronizar com prop value
    useEffect(() => {
      if (value !== internalValue) {
        setInternalValue(value);
        if (realTimeValidation) {
          validateInput(value);
        }
      }
    }, [value, internalValue, realTimeValidation, validateInput]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      // Aplicar limite de caracteres imediatamente no cliente (primeira linha de defesa)
      const truncatedValue = maxLength ? newValue.substring(0, maxLength) : newValue;
      
      setInternalValue(truncatedValue);
      
      if (realTimeValidation) {
        validateInput(truncatedValue);
      } else if (onChange) {
        onChange(truncatedValue, true); // Assumir válido até validação completa
      }
    }, [maxLength, realTimeValidation, validateInput, onChange]);

    const handleBlur = useCallback(() => {
      // Validação completa no blur
      validateInput(internalValue);
    }, [internalValue, validateInput]);

    // Indicador de segurança
    const SecurityIndicator = () => {
      if (!showSecurityIndicator) return null;

      const getIcon = () => {
        switch (securityLevel) {
          case 'safe':
            return <ShieldCheck className="w-4 h-4 text-green-500" />;
          case 'suspicious':
            return <Shield className="w-4 h-4 text-yellow-500" />;
          case 'dangerous':
            return <ShieldX className="w-4 h-4 text-red-500" />;
          default:
            return <Shield className="w-4 h-4 text-gray-400" />;
        }
      };

      const getTitle = () => {
        switch (securityLevel) {
          case 'safe':
            return 'Entrada segura';
          case 'suspicious':
            return 'Entrada suspeita - conteúdo foi sanitizado';
          case 'dangerous':
            return 'Entrada perigosa - código malicioso detectado e removido';
          default:
            return 'Verificando segurança...';
        }
      };

      return (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2" title={getTitle()}>
          {getIcon()}
        </div>
      );
    };

    // Classe CSS baseada no nível de segurança
    const getSecurityClass = () => {
      switch (securityLevel) {
        case 'suspicious':
          return 'border-yellow-300 focus:border-yellow-500';
        case 'dangerous':
          return 'border-red-300 focus:border-red-500';
        default:
          return '';
      }
    };

    // Determine which variant to use
    const useTextarea = variant === 'textarea' || multiline;
    
    // Filter out custom props that shouldn't be passed to DOM elements
    const { 
      fieldType: _fieldType,
      strictMode: _strictMode,
      showSecurityIndicator: _showSecurityIndicator,
      allowedChars: _allowedChars,
      blockedPatterns: _blockedPatterns,
      variant: _variant,
      multiline: _multiline,
      realTimeValidation: _realTimeValidation,
      rateLimitKey: _rateLimitKey,
      onSecurityViolation: _onSecurityViolation,
      ...domProps
    } = props;

    const inputProps = {
      ...domProps,
      value: internalValue,
      onChange: handleChange,
      onBlur: handleBlur,
      maxLength: maxLength, // Limite no HTML como primeira linha de defesa
      className: cn(
        className,
        getSecurityClass(),
        showSecurityIndicator && 'pr-8',
        !isValid && 'border-red-300 focus:border-red-500'
      ),
      'data-security-level': securityLevel,
      'data-field-type': fieldType,
      'data-strict-mode': strictMode
    };

    return (
      <div className="relative">
        {useTextarea ? (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            rows={rows}
            {...inputProps}
          />
        ) : (
          <Input
            ref={ref as React.Ref<HTMLInputElement>}
            {...inputProps}
          />
        )}
        <SecurityIndicator />
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';

// Hook para usar com formulários
export function useSecureInput(
  initialValue: string = '',
  options: {
    fieldType?: 'text' | 'email' | 'url' | 'numeric' | 'alphanumeric' | 'description';
    maxLength?: number;
    minLength?: number;
    strictMode?: boolean;
    rateLimitKey?: string;
  } = {}
) {
  const [value, setValue] = useState(initialValue);
  const [isValid, setIsValid] = useState(true);
  const [securityLevel, setSecurityLevel] = useState<'safe' | 'suspicious' | 'dangerous'>('safe');
  const [errors, setErrors] = useState<string[]>([]);

  const handleChange = useCallback((newValue: string, valid: boolean) => {
    setValue(newValue);
    setIsValid(valid);
  }, []);

  const handleSecurityViolation = useCallback((violations: string[]) => {
    setErrors(violations);
  }, []);

  const validate = useCallback(() => {
    const validation = advancedInputValidation(value, options);
    setIsValid(validation.isValid);
    setSecurityLevel(validation.securityLevel);
    setErrors(validation.errors);
    return validation;
  }, [value, options]);

  return {
    value,
    setValue: handleChange,
    isValid,
    securityLevel,
    errors,
    validate,
    inputProps: {
      value,
      onChange: handleChange,
      onSecurityViolation: handleSecurityViolation,
      ...options
    }
  };
}

export default SecureInput;