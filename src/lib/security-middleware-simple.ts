/**
 * Middleware de Segurança Simplificado
 * Versão sem recursão para evitar stack overflow
 */

import { supabase } from '@/integrations/supabase/client';
import { SecurityLogger } from './security';
import { recordSecurityViolation } from './security-audit';
import { containsMaliciousCode, sanitizeString } from './security';

interface RequestValidation {
  isValid: boolean;
  violations: string[];
  blocked: boolean;
  sanitizedData?: any;
}

class SimpleSecurityMiddleware {
  private static instance: SimpleSecurityMiddleware;
  private initialized = false;
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  private constructor() {
    // Não inicializar automaticamente para evitar recursão
  }

  public static getInstance(): SimpleSecurityMiddleware {
    if (!SimpleSecurityMiddleware.instance) {
      SimpleSecurityMiddleware.instance = new SimpleSecurityMiddleware();
    }
    return SimpleSecurityMiddleware.instance;
  }

  public initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.interceptSupabaseRequests();
    this.startCleanup();

    SecurityLogger.log('info', 'simple_security_middleware_initialized', {
      timestamp: new Date().toISOString()
    });
  }

  private interceptSupabaseRequests(): void {
    // Interceptar operações do Supabase de forma simples
    const originalFrom = supabase.from;
    
    supabase.from = function(table: string) {
      const query = originalFrom.call(this, table);
      
      // Interceptar insert
      const originalInsert = query.insert;
      query.insert = function(data: any) {
        const validation = SimpleSecurityMiddleware.getInstance().validateData(data, 'INSERT', table);
        
        if (!validation.isValid) {
          SecurityLogger.log('critical', 'supabase_insert_blocked', {
            table,
            violations: validation.violations
          });
          
          throw new Error('SECURITY_VIOLATION: Request blocked');
        }
        
        return originalInsert.call(this, validation.sanitizedData || data);
      };
      
      // Interceptar update
      const originalUpdate = query.update;
      query.update = function(data: any) {
        const validation = SimpleSecurityMiddleware.getInstance().validateData(data, 'UPDATE', table);
        
        if (!validation.isValid) {
          SecurityLogger.log('critical', 'supabase_update_blocked', {
            table,
            violations: validation.violations
          });
          
          throw new Error('SECURITY_VIOLATION: Request blocked');
        }
        
        return originalUpdate.call(this, validation.sanitizedData || data);
      };
      
      return query;
    };
  }

  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Limpar contadores expirados
      for (const [key, data] of this.requestCounts.entries()) {
        if (data.resetTime < now) {
          this.requestCounts.delete(key);
        }
      }
    }, 60000);
  }

  public validateData(data: any, operation: string, table: string): RequestValidation {
    const violations: string[] = [];
    let sanitizedData: any = {};
    let blocked = false;

    // Rate limiting simples
    const rateLimitKey = `${operation}_${table}`;
    if (!this.checkRateLimit(rateLimitKey, 20, 1)) {
      violations.push('RATE_LIMIT_EXCEEDED');
      blocked = true;
    }

    // Validar dados
    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          // Verificar conteúdo malicioso
          if (containsMaliciousCode(value)) {
            violations.push(`MALICIOUS_CONTENT_${key}`);
            blocked = true;
          }
          
          // Verificar comprimento
          if (value.length > 1000) {
            violations.push(`FIELD_TOO_LONG_${key}`);
            blocked = true;
          }
          
          // Sanitizar
          sanitizedData[key] = sanitizeString(value);
        } else {
          sanitizedData[key] = value;
        }
      }
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

  private checkRateLimit(key: string, maxRequests: number, windowMinutes: number): boolean {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const resetTime = now + windowMs;
    
    const current = this.requestCounts.get(key) || { count: 0, resetTime };
    
    if (current.resetTime < now) {
      current.count = 1;
      current.resetTime = resetTime;
    } else {
      current.count++;
    }
    
    this.requestCounts.set(key, current);
    
    return current.count <= maxRequests;
  }
}

// Inicializar automaticamente
const simpleSecurityMiddleware = SimpleSecurityMiddleware.getInstance();
simpleSecurityMiddleware.initialize();

export { simpleSecurityMiddleware as SecurityMiddleware };

export function validateRequest(data: any, operation: string, table: string) {
  return SimpleSecurityMiddleware.getInstance().validateData(data, operation, table);
}

export function isContentMalicious(content: string): boolean {
  return containsMaliciousCode(content);
}