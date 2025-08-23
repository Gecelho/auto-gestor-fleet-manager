/**
 * Interceptador de Segurança para Supabase
 * Valida e sanitiza todos os dados antes de enviá-los ao banco
 * Esta validação não pode ser contornada pelo cliente
 */

import { SecurityLogger } from './security';
import { containsMaliciousCode, sanitizeString } from './security';

// Função de validação local
function validateData(data: any, fieldMappings: any) {
  const securityViolations: string[] = [];
  const sanitizedData: any = {};
  
  if (!fieldMappings) {
    return { isValid: true, sanitizedData: data, securityViolations: [] };
  }
  
  for (const [key, value] of Object.entries(data)) {
    const fieldConfig = fieldMappings[key];
    if (!fieldConfig) {
      sanitizedData[key] = value;
      continue;
    }
    
    if (typeof value === 'string') {
      // Verificar conteúdo malicioso
      if (containsMaliciousCode(value)) {
        securityViolations.push(`Malicious content in field: ${key}`);
      }
      
      // Verificar limites de comprimento
      if (fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
        securityViolations.push(`Field ${key} exceeds maximum length`);
      }
      
      if (fieldConfig.minLength && value.length < fieldConfig.minLength) {
        securityViolations.push(`Field ${key} below minimum length`);
      }
      
      // Sanitizar
      sanitizedData[key] = sanitizeString(value);
    } else {
      sanitizedData[key] = value;
    }
  }
  
  return {
    isValid: securityViolations.length === 0,
    sanitizedData,
    securityViolations
  };
}

// Configurações específicas por tabela
const TABLE_SECURITY_CONFIG = {
  cars: {
    name: 'name',
    plate: 'plate', 
    purchase_value: 'price',
    payment_method: 'name',
    purchase_date: 'date',
    mileage: 'mileage',
    notes: 'notes'
  },
  expenses: {
    description: 'description',
    value: 'price',
    category: 'name',
    date: 'date',
    notes: 'notes'
  },
  revenues: {
    description: 'description',
    value: 'price',
    date: 'date',
    notes: 'notes'
  },
  drivers: {
    name: 'name',
    document: 'document',
    phone: 'phone',
    email: 'email',
    address: 'address'
  }
};

/**
 * Intercepta e valida dados antes de operações no Supabase
 */
export class SupabaseSecurityInterceptor {
  private static instance: SupabaseSecurityInterceptor;
  private operationCount = new Map<string, number>();
  private lastOperation = new Map<string, number>();

  static getInstance(): SupabaseSecurityInterceptor {
    if (!SupabaseSecurityInterceptor.instance) {
      SupabaseSecurityInterceptor.instance = new SupabaseSecurityInterceptor();
    }
    return SupabaseSecurityInterceptor.instance;
  }

  /**
   * Valida dados antes de inserção
   */
  async validateInsert(table: string, data: Record<string, any>, userId?: string): Promise<{
    isValid: boolean;
    sanitizedData: Record<string, any>;
    errors: string[];
    securityViolations: string[];
  }> {
    const operationKey = `${userId || 'anonymous'}_${table}_insert`;
    
    // Rate limiting por usuário e tabela
    if (!this.checkRateLimit(operationKey, 10, 60000)) { // 10 operações por minuto
      SecurityLogger.log('warning', 'supabase_rate_limit_exceeded', {
        table,
        userId,
        operation: 'insert'
      });
      
      return {
        isValid: false,
        sanitizedData: {},
        errors: ['Muitas operações. Aguarde um momento.'],
        securityViolations: ['RATE_LIMIT_EXCEEDED']
      };
    }

    // Obter mapeamento de campos para a tabela
    const fieldMappings = TABLE_SECURITY_CONFIG[table as keyof typeof TABLE_SECURITY_CONFIG];
    
    if (!fieldMappings) {
      SecurityLogger.log('warning', 'unknown_table_operation', {
        table,
        operation: 'insert',
        userId
      });
    }

    // Validar dados usando o sistema de segurança do servidor
    const validation = validateData(data, fieldMappings);
    
    // Log da operação
    if (validation.securityViolations.length > 0) {
      SecurityLogger.log('critical', 'supabase_security_violation', {
        table,
        operation: 'insert',
        violations: validation.securityViolations,
        blockedFields: validation.blockedFields,
        userId,
        originalData: JSON.stringify(data).substring(0, 500)
      });
    } else if (validation.errors.length > 0) {
      SecurityLogger.log('warning', 'supabase_validation_error', {
        table,
        operation: 'insert',
        errors: validation.errors,
        userId
      });
    } else {
      SecurityLogger.log('info', 'supabase_operation_validated', {
        table,
        operation: 'insert',
        fieldCount: Object.keys(data).length,
        userId
      });
    }

    return validation;
  }

  /**
   * Valida dados antes de atualização
   */
  async validateUpdate(table: string, data: Record<string, any>, id: string, userId?: string): Promise<{
    isValid: boolean;
    sanitizedData: Record<string, any>;
    errors: string[];
    securityViolations: string[];
  }> {
    const operationKey = `${userId || 'anonymous'}_${table}_update`;
    
    // Rate limiting
    if (!this.checkRateLimit(operationKey, 15, 60000)) { // 15 updates por minuto
      SecurityLogger.log('warning', 'supabase_rate_limit_exceeded', {
        table,
        userId,
        operation: 'update',
        recordId: id
      });
      
      return {
        isValid: false,
        sanitizedData: {},
        errors: ['Muitas operações. Aguarde um momento.'],
        securityViolations: ['RATE_LIMIT_EXCEEDED']
      };
    }

    // Validar se o ID não contém caracteres maliciosos
    if (!/^[a-zA-Z0-9\-_]+$/.test(id)) {
      SecurityLogger.log('critical', 'malicious_id_detected', {
        table,
        operation: 'update',
        maliciousId: id,
        userId
      });
      
      return {
        isValid: false,
        sanitizedData: {},
        errors: ['ID inválido'],
        securityViolations: ['MALICIOUS_ID']
      };
    }

    const fieldMappings = TABLE_SECURITY_CONFIG[table as keyof typeof TABLE_SECURITY_CONFIG];
    const validation = validateData(data, fieldMappings);
    
    // Log da operação
    if (validation.securityViolations.length > 0) {
      SecurityLogger.log('critical', 'supabase_security_violation', {
        table,
        operation: 'update',
        recordId: id,
        violations: validation.securityViolations,
        blockedFields: validation.blockedFields,
        userId
      });
    }

    return validation;
  }

  /**
   * Valida operações de delete
   */
  async validateDelete(table: string, id: string, userId?: string): Promise<{
    isValid: boolean;
    errors: string[];
    securityViolations: string[];
  }> {
    const operationKey = `${userId || 'anonymous'}_${table}_delete`;
    
    // Rate limiting mais restritivo para deletes
    if (!this.checkRateLimit(operationKey, 5, 60000)) { // 5 deletes por minuto
      SecurityLogger.log('warning', 'supabase_rate_limit_exceeded', {
        table,
        userId,
        operation: 'delete',
        recordId: id
      });
      
      return {
        isValid: false,
        errors: ['Muitas operações de exclusão. Aguarde um momento.'],
        securityViolations: ['RATE_LIMIT_EXCEEDED']
      };
    }

    // Validar ID
    if (!/^[a-zA-Z0-9\-_]+$/.test(id)) {
      SecurityLogger.log('critical', 'malicious_id_detected', {
        table,
        operation: 'delete',
        maliciousId: id,
        userId
      });
      
      return {
        isValid: false,
        errors: ['ID inválido'],
        securityViolations: ['MALICIOUS_ID']
      };
    }

    SecurityLogger.log('info', 'supabase_delete_validated', {
      table,
      recordId: id,
      userId
    });

    return {
      isValid: true,
      errors: [],
      securityViolations: []
    };
  }

  /**
   * Rate limiting interno
   */
  private checkRateLimit(key: string, maxOperations: number, windowMs: number): boolean {
    const now = Date.now();
    const lastOp = this.lastOperation.get(key) || 0;
    const count = this.operationCount.get(key) || 0;

    // Reset counter if window expired
    if (now - lastOp > windowMs) {
      this.operationCount.set(key, 1);
      this.lastOperation.set(key, now);
      return true;
    }

    // Check if limit exceeded
    if (count >= maxOperations) {
      return false;
    }

    // Increment counter
    this.operationCount.set(key, count + 1);
    this.lastOperation.set(key, now);
    return true;
  }

  /**
   * Limpa dados antigos de rate limiting
   */
  cleanup(): void {
    const now = Date.now();
    const windowMs = 60000; // 1 minuto

    for (const [key, lastOp] of this.lastOperation.entries()) {
      if (now - lastOp > windowMs) {
        this.operationCount.delete(key);
        this.lastOperation.delete(key);
      }
    }
  }
}

// Instância singleton
export const supabaseInterceptor = SupabaseSecurityInterceptor.getInstance();

// Limpar dados antigos a cada minuto
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    supabaseInterceptor.cleanup();
  }, 60000);
}

/**
 * Wrapper seguro para operações do Supabase
 */
export const secureSupabaseOperation = {
  /**
   * Insert seguro
   */
  async insert<T>(
    supabaseClient: any,
    table: string,
    data: Record<string, any>,
    userId?: string
  ): Promise<{ data: T | null; error: any }> {
    try {
      const validation = await supabaseInterceptor.validateInsert(table, data, userId);
      
      if (!validation.isValid) {
        return {
          data: null,
          error: {
            message: validation.errors.join(', ') || 'Dados inválidos',
            details: validation.securityViolations.join(', '),
            code: 'SECURITY_VALIDATION_FAILED'
          }
        };
      }

      // Usar dados sanitizados
      const result = await supabaseClient
        .from(table)
        .insert(validation.sanitizedData)
        .select()
        .single();

      return result;
    } catch (error) {
      SecurityLogger.log('error', 'supabase_operation_error', {
        table,
        operation: 'insert',
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      
      return {
        data: null,
        error
      };
    }
  },

  /**
   * Update seguro
   */
  async update<T>(
    supabaseClient: any,
    table: string,
    data: Record<string, any>,
    id: string,
    userId?: string
  ): Promise<{ data: T | null; error: any }> {
    try {
      const validation = await supabaseInterceptor.validateUpdate(table, data, id, userId);
      
      if (!validation.isValid) {
        return {
          data: null,
          error: {
            message: validation.errors.join(', ') || 'Dados inválidos',
            details: validation.securityViolations.join(', '),
            code: 'SECURITY_VALIDATION_FAILED'
          }
        };
      }

      const result = await supabaseClient
        .from(table)
        .update(validation.sanitizedData)
        .eq('id', id)
        .select()
        .single();

      return result;
    } catch (error) {
      SecurityLogger.log('error', 'supabase_operation_error', {
        table,
        operation: 'update',
        recordId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      
      return {
        data: null,
        error
      };
    }
  },

  /**
   * Delete seguro
   */
  async delete(
    supabaseClient: any,
    table: string,
    id: string,
    userId?: string
  ): Promise<{ error: any }> {
    try {
      const validation = await supabaseInterceptor.validateDelete(table, id, userId);
      
      if (!validation.isValid) {
        return {
          error: {
            message: validation.errors.join(', ') || 'Operação inválida',
            details: validation.securityViolations.join(', '),
            code: 'SECURITY_VALIDATION_FAILED'
          }
        };
      }

      const result = await supabaseClient
        .from(table)
        .delete()
        .eq('id', id);

      return result;
    } catch (error) {
      SecurityLogger.log('error', 'supabase_operation_error', {
        table,
        operation: 'delete',
        recordId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      
      return { error };
    }
  }
};

export default {
  supabaseInterceptor,
  secureSupabaseOperation,
  SupabaseSecurityInterceptor
};