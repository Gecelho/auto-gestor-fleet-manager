import React, { useState, useCallback, useEffect } from 'react';
import { useForm, UseFormProps, FieldValues, UseFormReturn } from 'react-hook-form';
import { 
  secureFormData, 
  generateCSRFToken, 
  validateCSRFToken, 
  securityMiddleware,
  SecurityLogger,
  rateLimiter,
  generateSecureHash
} from '@/lib/security';
import { toast } from 'sonner';

interface SecurityOptions {
  enableCSRF?: boolean;
  enableSanitization?: boolean;
  enableValidation?: boolean;
  enableRateLimit?: boolean;
  enableIntegrityCheck?: boolean;
  rateLimitKey?: string;
  maxSubmissions?: number;
  windowMs?: number;
  strictMode?: boolean;
  onSecurityViolation?: (violations: string[]) => void;
  onSanitization?: (sanitizedFields: string[]) => void;
  onRateLimitExceeded?: () => void;
}

interface SecureFormReturn<T extends FieldValues> extends UseFormReturn<T> {
  secureSubmit: (
    onSubmit: (data: T) => void | Promise<void>,
    fieldRules?: Partial<Record<keyof T, {
      maxLength?: number;
      minLength?: number;
      fieldType?: 'text' | 'email' | 'url' | 'numeric' | 'alphanumeric' | 'description';
      required?: boolean;
      strictMode?: boolean;
    }>>
  ) => (data: T) => Promise<void>;
  csrfToken: string;
  securityStatus: {
    isSecure: boolean;
    lastViolations: string[];
    lastSanitizedFields: string[];
    securityLevel: 'safe' | 'suspicious' | 'dangerous';
    submissionCount: number;
    rateLimitRemaining: number;
  };
  resetSecurity: () => void;
}

/**
 * Hook personalizado para formulários seguros com proteção XSS, CSRF, Rate Limiting e mais
 */
export function useSecureForm<T extends FieldValues = FieldValues>(
  props?: UseFormProps<T>,
  securityOptions: SecurityOptions = {}
): SecureFormReturn<T> {
  const {
    enableCSRF = true,
    enableSanitization = true,
    enableValidation = true,
    enableRateLimit = true,
    enableIntegrityCheck = false,
    rateLimitKey = 'default_form',
    maxSubmissions = 10,
    windowMs = 60000,
    strictMode = false,
    onSecurityViolation,
    onSanitization,
    onRateLimitExceeded
  } = securityOptions;

  const form = useForm<T>(props);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [submissionCount, setSubmissionCount] = useState(0);
  const [securityStatus, setSecurityStatus] = useState({
    isSecure: true,
    lastViolations: [] as string[],
    lastSanitizedFields: [] as string[],
    securityLevel: 'safe' as 'safe' | 'suspicious' | 'dangerous',
    submissionCount: 0,
    rateLimitRemaining: maxSubmissions
  });

  // Gerar token CSRF na inicialização
  useEffect(() => {
    if (enableCSRF) {
      setCsrfToken(generateCSRFToken());
    }
  }, [enableCSRF]);

  // Função de submit segura avançada
  const secureSubmit = useCallback(
    (
      onSubmit: (data: T) => void | Promise<void>,
      fieldRules: Partial<Record<keyof T, {
        maxLength?: number;
        minLength?: number;
        fieldType?: 'text' | 'email' | 'url' | 'numeric' | 'alphanumeric' | 'description';
        required?: boolean;
        strictMode?: boolean;
      }>> = {}
    ) => {
      return async (data: T) => {
        try {
          // Rate limiting
          if (enableRateLimit) {
            const identifier = `${rateLimitKey}_${navigator.userAgent.substring(0, 50)}`;
            if (!rateLimiter.isAllowed(identifier, maxSubmissions, windowMs)) {
              const remaining = rateLimiter.getRemainingAttempts(identifier, maxSubmissions);
              
              SecurityLogger.log('warning', 'rate_limit_exceeded', {
                identifier,
                maxSubmissions,
                windowMs,
                remaining
              });
              
              toast.error(`Muitas tentativas. Tente novamente em ${Math.ceil(windowMs / 60000)} minutos.`);
              
              if (onRateLimitExceeded) {
                onRateLimitExceeded();
              }
              
              setSecurityStatus(prev => ({
                ...prev,
                rateLimitRemaining: remaining
              }));
              
              return;
            }
          }

          // Validar CSRF token se habilitado
          if (enableCSRF) {
            const formCsrfToken = (data as any).__csrf_token;
            if (!validateCSRFToken(formCsrfToken, csrfToken)) {
              SecurityLogger.log('error', 'csrf_violation', {
                expectedToken: csrfToken.substring(0, 8) + '...',
                receivedToken: formCsrfToken?.substring(0, 8) + '...'
              });
              
              toast.error('Token de segurança inválido. Recarregue a página.');
              return;
            }
            // Remove o token CSRF dos dados antes de processar
            delete (data as any).__csrf_token;
          }

          let processedData = data;
          let securityReport = {
            isSecure: true,
            violations: [] as string[],
            sanitizedFields: [] as string[],
            overallSecurityLevel: 'safe' as 'safe' | 'suspicious' | 'dangerous'
          };

          // Aplicar middleware de segurança avançado
          if (enableSanitization || enableValidation) {
            const result = securityMiddleware(data, fieldRules);
            processedData = result.sanitizedData;
            
            securityReport = {
              isSecure: result.isSecure,
              violations: Object.values(result.securityReport.errors).flat(),
              sanitizedFields: result.securityReport.suspiciousFields.concat(result.securityReport.dangerousFields),
              overallSecurityLevel: result.securityReport.overallSecurityLevel
            };

            // Log detalhado de segurança
            if (result.securityReport.dangerousFields.length > 0) {
              SecurityLogger.log('critical', 'dangerous_form_submission', {
                dangerousFields: result.securityReport.dangerousFields,
                errors: result.securityReport.errors,
                originalData: JSON.stringify(data).substring(0, 500),
                sanitizedData: JSON.stringify(processedData).substring(0, 500)
              });
            } else if (result.securityReport.suspiciousFields.length > 0) {
              SecurityLogger.log('warning', 'suspicious_form_submission', {
                suspiciousFields: result.securityReport.suspiciousFields,
                errors: result.securityReport.errors
              });
            }

            // Atualizar status de segurança
            const newSubmissionCount = submissionCount + 1;
            setSubmissionCount(newSubmissionCount);
            
            setSecurityStatus({
              isSecure: securityReport.isSecure,
              lastViolations: securityReport.violations,
              lastSanitizedFields: securityReport.sanitizedFields,
              securityLevel: securityReport.overallSecurityLevel,
              submissionCount: newSubmissionCount,
              rateLimitRemaining: enableRateLimit ? 
                rateLimiter.getRemainingAttempts(`${rateLimitKey}_${navigator.userAgent.substring(0, 50)}`, maxSubmissions) : 
                maxSubmissions
            });

            // Chamar callbacks de segurança
            if (!securityReport.isSecure && onSecurityViolation) {
              onSecurityViolation(securityReport.violations);
            }

            if (securityReport.sanitizedFields.length > 0 && onSanitization) {
              onSanitization(securityReport.sanitizedFields);
            }

            // Mostrar avisos de segurança baseados no nível
            if (securityReport.overallSecurityLevel === 'dangerous') {
              toast.error('Código malicioso detectado e removido. Submissão bloqueada por segurança.');
              
              if (strictMode) {
                SecurityLogger.log('critical', 'form_submission_blocked', {
                  reason: 'strict_mode_dangerous_content',
                  violations: securityReport.violations
                });
                return; // Bloquear submissão em modo estrito
              }
            } else if (securityReport.overallSecurityLevel === 'suspicious') {
              toast.warning('Conteúdo suspeito detectado e sanitizado.');
            }

            if (securityReport.sanitizedFields.length > 0) {
              toast.info('Alguns campos foram sanitizados por segurança.');
            }

            // Verificação de integridade se habilitada
            if (enableIntegrityCheck) {
              const dataHash = await generateSecureHash(JSON.stringify(processedData));
              SecurityLogger.log('info', 'form_integrity_check', {
                dataHash,
                fieldCount: Object.keys(processedData).length
              });
            }
          }

          // Log de submissão bem-sucedida
          SecurityLogger.log('info', 'secure_form_submission', {
            securityLevel: securityReport.overallSecurityLevel,
            fieldCount: Object.keys(processedData).length,
            sanitizedFields: securityReport.sanitizedFields.length,
            submissionCount: submissionCount + 1
          });

          // Executar o submit original com dados seguros
          await onSubmit(processedData);

          // Gerar novo token CSRF após submit bem-sucedido
          if (enableCSRF) {
            setCsrfToken(generateCSRFToken());
          }

        } catch (error) {
          SecurityLogger.log('error', 'form_submission_error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
          });
          
          console.error('Erro no submit seguro:', error);
          toast.error('Erro ao processar formulário.');
          throw error;
        }
      };
    },
    [
      csrfToken, 
      enableCSRF, 
      enableSanitization, 
      enableValidation, 
      enableRateLimit,
      enableIntegrityCheck,
      rateLimitKey,
      maxSubmissions,
      windowMs,
      strictMode,
      submissionCount,
      onSecurityViolation, 
      onSanitization,
      onRateLimitExceeded
    ]
  );

  // Função para resetar status de segurança
  const resetSecurity = useCallback(() => {
    setSecurityStatus({
      isSecure: true,
      lastViolations: [],
      lastSanitizedFields: [],
      securityLevel: 'safe',
      submissionCount: 0,
      rateLimitRemaining: maxSubmissions
    });
    setSubmissionCount(0);
    
    if (enableCSRF) {
      setCsrfToken(generateCSRFToken());
    }
    
    SecurityLogger.log('info', 'security_status_reset', {
      rateLimitKey
    });
  }, [enableCSRF, maxSubmissions, rateLimitKey]);

  return {
    ...form,
    secureSubmit,
    csrfToken,
    securityStatus,
    resetSecurity
  };
}

/**
 * Hook para validação de input em tempo real
 */
export function useSecureInput(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);
  const [isSecure, setIsSecure] = useState(true);
  const [violations, setViolations] = useState<string[]>([]);

  const handleChange = useCallback((newValue: string) => {
    const result = secureFormData({ value: newValue });
    
    setValue(result.sanitizedData.value);
    setIsSecure(result.securityReport.isSecure);
    setViolations(result.securityReport.violations);

    if (!result.securityReport.isSecure) {
      toast.error('Conteúdo malicioso detectado e removido.');
    }
  }, []);

  return {
    value,
    setValue: handleChange,
    isSecure,
    violations,
    securityStatus: {
      isSecure,
      violations
    }
  };
}

/**
 * Componente wrapper para inputs seguros
 */
export function withSecurityValidation<T extends React.ComponentType<any>>(
  Component: T,
  securityOptions: SecurityOptions = {}
) {
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    const { onChange, value, ...otherProps } = props;
    const { value: secureValue, setValue } = useSecureInput(value);

    const handleSecureChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setValue(newValue);
      
      if (onChange) {
        // Criar um novo evento com o valor sanitizado
        const secureEvent = {
          ...event,
          target: {
            ...event.target,
            value: secureValue
          }
        };
        onChange(secureEvent);
      }
    }, [setValue, secureValue, onChange]);

    return React.createElement(Component, {
      ref,
      ...otherProps,
      value: secureValue,
      onChange: handleSecureChange
    });
  });
}