/**
 * Middleware de Segurança Global
 * Intercepta TODAS as requisições e aplica validações que não podem ser contornadas
 */

import { supabase } from '@/integrations/supabase/client';
import { SecurityLogger } from './security';
import { recordSecurityViolation, isUserBlocked } from './security-audit';

interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
  'X-XSS-Protection': string;
}

interface RequestValidation {
  isValid: boolean;
  violations: string[];
  blocked: boolean;
  sanitizedData?: any;
}

class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private securityHeaders: SecurityHeaders;
  private blockedIPs = new Set<string>();
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  private suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /document\./gi,
    /window\./gi,
    /alert\s*\(/gi,
    /confirm\s*\(/gi,
    /prompt\s*\(/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /import\s*\(/gi,
    /require\s*\(/gi,
    /\bSELECT\b.*\bFROM\b/gi,
    /\bINSERT\b.*\bINTO\b/gi,
    /\bUPDATE\b.*\bSET\b/gi,
    /\bDELETE\b.*\bFROM\b/gi,
    /\bDROP\b.*\bTABLE\b/gi,
    /\bCREATE\b.*\bTABLE\b/gi,
    /\bALTER\b.*\bTABLE\b/gi,
    /\bEXEC\b/gi,
    /\bUNION\b.*\bSELECT\b/gi,
    /--/g,
    /\/\*/g,
    /\*\//g,
    /xp_/gi,
    /sp_/gi
  ];

  private constructor() {
    this.securityHeaders = {
      'Content-Security-Policy': this.buildCSP(),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': this.buildPermissionsPolicy(),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-XSS-Protection': '1; mode=block'
    };

    this.initializeMiddleware();
  }

  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  private buildCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
  }

  private buildPermissionsPolicy(): string {
    return [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'picture-in-picture=()'
    ].join(', ');
  }

  private initializeMiddleware(): void {
    // Aplicar headers de segurança
    this.applySecurityHeaders();

    // Interceptar requisições do Supabase
    this.interceptSupabaseRequests();

    // Interceptar eventos do DOM
    this.interceptDOMEvents();

    // Monitorar tentativas de manipulação do console
    this.protectConsole();

    // Iniciar limpeza periódica
    this.startPeriodicCleanup();

    SecurityLogger.log('info', 'security_middleware_initialized', {
      timestamp: new Date().toISOString(),
      headers: Object.keys(this.securityHeaders)
    });
  }

  private applySecurityHeaders(): void {
    // Aplicar headers via meta tags (fallback)
    Object.entries(this.securityHeaders).forEach(([name, value]) => {
      const meta = document.createElement('meta');
      meta.httpEquiv = name;
      meta.content = value;
      document.head.appendChild(meta);
    });
  }

  private interceptSupabaseRequests(): void {
    // Interceptar todas as operações do Supabase
    const originalFrom = supabase.from;
    
    supabase.from = function(table: string) {
      const query = originalFrom.call(this, table);
      
      // Interceptar insert
      const originalInsert = query.insert;
      query.insert = function(data: any) {
        const validation = SecurityMiddleware.getInstance().validateRequestData(data, 'INSERT', table);
        
        if (!validation.isValid) {
          SecurityLogger.log('critical', 'supabase_insert_blocked', {
            table,
            violations: validation.violations,
            originalData: JSON.stringify(data).substring(0, 200)
          });
          
          throw new Error('SECURITY_VIOLATION: Request blocked due to security violations');
        }
        
        return originalInsert.call(this, validation.sanitizedData || data);
      };
      
      // Interceptar update
      const originalUpdate = query.update;
      query.update = function(data: any) {
        const validation = SecurityMiddleware.getInstance().validateRequestData(data, 'UPDATE', table);
        
        if (!validation.isValid) {
          SecurityLogger.log('critical', 'supabase_update_blocked', {
            table,
            violations: validation.violations,
            originalData: JSON.stringify(data).substring(0, 200)
          });
          
          throw new Error('SECURITY_VIOLATION: Request blocked due to security violations');
        }
        
        return originalUpdate.call(this, validation.sanitizedData || data);
      };
      
      return query;
    };
  }

  private interceptDOMEvents(): void {
    // Interceptar tentativas de modificação do DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Verificar se é um script malicioso
              if (element.tagName === 'SCRIPT') {
                const scriptContent = element.textContent || element.innerHTML;
                if (this.containsMaliciousContent(scriptContent)) {
                  element.remove();
                  
                  recordSecurityViolation(
                    'XSS_ATTEMPT',
                    'CRITICAL',
                    'dom_manipulation',
                    'script_injection',
                    scriptContent,
                    '[REMOVED]',
                    true,
                    { method: 'dom_mutation' }
                  );
                  
                  SecurityLogger.log('critical', 'malicious_script_blocked', {
                    content: scriptContent.substring(0, 100),
                    method: 'dom_mutation'
                  });
                }
              }
              
              // Verificar atributos perigosos
              Array.from(element.attributes || []).forEach((attr) => {
                if (attr.name.startsWith('on') || attr.value.includes('javascript:')) {
                  element.removeAttribute(attr.name);
                  
                  recordSecurityViolation(
                    'XSS_ATTEMPT',
                    'HIGH',
                    'dom_manipulation',
                    attr.name,
                    attr.value,
                    '[REMOVED]',
                    true,
                    { method: 'attribute_injection' }
                  );
                }
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus']
    });
  }

  private protectConsole(): void {
    // Detectar tentativas de uso do console para bypass
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      const message = args.join(' ');
      if (this.containsMaliciousContent(message)) {
        recordSecurityViolation(
          'MALICIOUS_INPUT',
          'MEDIUM',
          'console_manipulation',
          'console.log',
          message,
          '[BLOCKED]',
          true,
          { method: 'console_injection' }
        );
        return;
      }
      originalLog.apply(console, args);
    };

    // Bloquear tentativas de redefinir funções de segurança
    Object.defineProperty(window, 'SecurityMiddleware', {
      value: undefined,
      writable: false,
      configurable: false
    });

    // Proteger funções críticas
    const protectedFunctions = [
      'eval',
      'Function',
      'setTimeout',
      'setInterval',
      'XMLHttpRequest',
      'fetch'
    ];

    protectedFunctions.forEach(funcName => {
      const original = (window as any)[funcName];
      if (original) {
        (window as any)[funcName] = function(...args: any[]) {
          const argString = args.join(' ');
          const instance = SecurityMiddleware.instance;
          if (instance && instance.containsMaliciousContent(argString)) {
            recordSecurityViolation(
              'MALICIOUS_INPUT',
              'CRITICAL',
              'function_call',
              funcName,
              argString,
              '[BLOCKED]',
              true,
              { method: 'protected_function_call' }
            );
            
            throw new Error(`SECURITY_VIOLATION: Malicious use of ${funcName} detected and blocked`);
          }
          
          return original.apply(this, args);
        };
      }
    });
  }

  private startPeriodicCleanup(): void {
    // Evitar múltiplos intervalos
    if ((this as any)._cleanupInterval) {
      return;
    }
    
    (this as any)._cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      // Limpar contadores de rate limit expirados
      for (const [key, data] of this.requestCounts.entries()) {
        if (data.resetTime < now) {
          this.requestCounts.delete(key);
        }
      }
      
      // Limpar IPs bloqueados temporariamente (após 15 minutos)
      // Note: IPs são removidos automaticamente pelo sistema de auditoria
      
    }, 60000); // A cada minuto
  }

  public validateRequestData(data: any, operation: string, table: string): RequestValidation {
    const violations: string[] = [];
    let sanitizedData: any = {};
    let blocked = false;

    // Verificar se o usuário está bloqueado
    if (isUserBlocked()) {
      return {
        isValid: false,
        violations: ['USER_BLOCKED'],
        blocked: true
      };
    }

    // Validar cada campo do objeto
    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          const validation = this.validateStringField(key, value, table);
          
          if (!validation.isValid) {
            violations.push(...validation.violations);
            if (validation.blocked) {
              blocked = true;
            }
          }
          
          sanitizedData[key] = validation.sanitizedValue;
        } else {
          sanitizedData[key] = value;
        }
      }
    }

    // Rate limiting por operação
    const rateLimitKey = `${operation}_${table}`;
    if (!this.checkRateLimit(rateLimitKey, 20, 60)) { // 20 operações por minuto
      violations.push('RATE_LIMIT_EXCEEDED');
      blocked = true;
    }

    const isValid = violations.length === 0 && !blocked;

    if (!isValid) {
      recordSecurityViolation(
        blocked ? 'MALICIOUS_INPUT' : 'SUSPICIOUS_INPUT',
        blocked ? 'CRITICAL' : 'MEDIUM',
        'request_validation',
        `${operation}_${table}`,
        JSON.stringify(data).substring(0, 200),
        JSON.stringify(sanitizedData).substring(0, 200),
        blocked,
        { violations, operation, table }
      );
    }

    return {
      isValid,
      violations,
      blocked,
      sanitizedData: isValid ? sanitizedData : undefined
    };
  }

  private validateStringField(fieldName: string, value: string, table: string): {
    isValid: boolean;
    violations: string[];
    blocked: boolean;
    sanitizedValue: string;
  } {
    const violations: string[] = [];
    let blocked = false;
    let sanitizedValue = value;

    // Verificar conteúdo malicioso
    if (this.containsMaliciousContent(value)) {
      violations.push('MALICIOUS_CONTENT');
      blocked = true;
      sanitizedValue = this.sanitizeString(value);
    }

    // Verificar limites de comprimento baseados na tabela e campo
    const limits = this.getFieldLimits(table, fieldName);
    if (limits) {
      if (limits.required && (!value || value.trim().length === 0)) {
        violations.push('REQUIRED_FIELD_EMPTY');
        blocked = true;
      }
      
      if (value.length > limits.maxLength) {
        violations.push('FIELD_TOO_LONG');
        blocked = true;
        sanitizedValue = value.substring(0, limits.maxLength);
      }
      
      if (value.length < limits.minLength) {
        violations.push('FIELD_TOO_SHORT');
        blocked = true;
      }
    }

    return {
      isValid: violations.length === 0 && !blocked,
      violations,
      blocked,
      sanitizedValue
    };
  }

  private getFieldLimits(table: string, field: string): { minLength: number; maxLength: number; required: boolean } | null {
    const limits: Record<string, Record<string, { minLength: number; maxLength: number; required: boolean }>> = {
      cars: {
        name: { minLength: 2, maxLength: 100, required: true },
        plate: { minLength: 7, maxLength: 10, required: true },
        observations: { minLength: 0, maxLength: 1000, required: false }
      },
      expenses: {
        description: { minLength: 2, maxLength: 200, required: true },
        observation: { minLength: 0, maxLength: 1000, required: false }
      },
      revenues: {
        description: { minLength: 2, maxLength: 200, required: true }
      },
      drivers: {
        name: { minLength: 2, maxLength: 100, required: true },
        phone: { minLength: 0, maxLength: 15, required: false },
        cpf: { minLength: 0, maxLength: 14, required: false },
        address: { minLength: 0, maxLength: 200, required: false }
      }
    };

    return limits[table]?.[field] || null;
  }

  public containsMaliciousContent(input: string): boolean {
    if (!input || typeof input !== 'string') return false;
    
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  private sanitizeString(input: string): string {
    let sanitized = input;
    
    // Remover tags HTML
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Remover javascript:
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remover event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    // Remover caracteres perigosos
    sanitized = sanitized.replace(/[<>"'&\\\/`()]/g, '');
    
    return sanitized.trim();
  }

  private checkRateLimit(key: string, maxRequests: number, windowMinutes: number): boolean {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const resetTime = now + windowMs;
    
    const current = this.requestCounts.get(key) || { count: 0, resetTime };
    
    if (current.resetTime < now) {
      // Reset window
      current.count = 1;
      current.resetTime = resetTime;
    } else {
      current.count++;
    }
    
    this.requestCounts.set(key, current);
    
    if (current.count > maxRequests) {
      recordSecurityViolation(
        'RATE_LIMIT_EXCEEDED',
        'HIGH',
        'rate_limiting',
        key,
        `${current.count}/${maxRequests}`,
        '[BLOCKED]',
        true,
        { windowMinutes, maxRequests }
      );
      
      return false;
    }
    
    return true;
  }

  public getSecurityHeaders(): SecurityHeaders {
    return { ...this.securityHeaders };
  }

  public isBlocked(identifier: string): boolean {
    return this.blockedIPs.has(identifier);
  }

  public blockTemporarily(identifier: string, durationMinutes: number = 15): void {
    this.blockedIPs.add(identifier);
    
    setTimeout(() => {
      this.blockedIPs.delete(identifier);
      SecurityLogger.log('info', 'temporary_block_expired', { identifier });
    }, durationMinutes * 60 * 1000);
    
    SecurityLogger.log('warning', 'temporary_block_applied', { 
      identifier, 
      durationMinutes 
    });
  }
}

// Inicializar middleware automaticamente
const securityMiddleware = SecurityMiddleware.getInstance();

// Exportar instância e funções utilitárias
export { securityMiddleware as SecurityMiddleware };

export function validateRequest(data: any, operation: string, table: string) {
  return SecurityMiddleware.getInstance().validateRequestData(data, operation, table);
}

export function isContentMalicious(content: string): boolean {
  return SecurityMiddleware.getInstance().containsMaliciousContent(content);
}

export function getSecurityHeaders() {
  return SecurityMiddleware.getInstance().getSecurityHeaders();
}