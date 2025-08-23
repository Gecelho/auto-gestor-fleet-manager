import { SupabaseClient } from '@supabase/supabase-js';
import { sanitizeObject, validateObjectSecurity } from './security';
import { toast } from 'sonner';

/**
 * Wrapper seguro para operações do Supabase
 */
export class SecureSupabaseClient {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Insert seguro com sanitização automática
   */
  async secureInsert<T extends Record<string, any>>(
    table: string, 
    data: T | T[],
    options: { 
      validateSecurity?: boolean;
      sanitizeData?: boolean;
      onSecurityViolation?: (violations: string[]) => void;
    } = {}
  ) {
    const { 
      validateSecurity = true, 
      sanitizeData = true,
      onSecurityViolation 
    } = options;

    let processedData = data;

    if (Array.isArray(data)) {
      // Processar array de dados
      processedData = data.map(item => {
        if (validateSecurity) {
          const validation = validateObjectSecurity(item);
          if (!validation.isValid) {
            console.warn(`Violações de segurança detectadas no insert:`, validation.violations);
            if (onSecurityViolation) {
              onSecurityViolation(validation.violations);
            }
            toast.error('Dados inseguros detectados e sanitizados.');
          }
        }

        return sanitizeData ? sanitizeObject(item) : item;
      }) as T[];
    } else {
      // Processar objeto único
      if (validateSecurity) {
        const validation = validateObjectSecurity(data);
        if (!validation.isValid) {
          console.warn(`Violações de segurança detectadas no insert:`, validation.violations);
          if (onSecurityViolation) {
            onSecurityViolation(validation.violations);
          }
          toast.error('Dados inseguros detectados e sanitizados.');
        }
      }

      processedData = sanitizeData ? sanitizeObject(data) : data;
    }

    return this.supabase.from(table).insert(processedData);
  }

  /**
   * Update seguro com sanitização automática
   */
  async secureUpdate<T extends Record<string, any>>(
    table: string,
    data: Partial<T>,
    match: Record<string, any>,
    options: { 
      validateSecurity?: boolean;
      sanitizeData?: boolean;
      onSecurityViolation?: (violations: string[]) => void;
    } = {}
  ) {
    const { 
      validateSecurity = true, 
      sanitizeData = true,
      onSecurityViolation 
    } = options;

    let processedData = data;

    if (validateSecurity) {
      const validation = validateObjectSecurity(data);
      if (!validation.isValid) {
        console.warn(`Violações de segurança detectadas no update:`, validation.violations);
        if (onSecurityViolation) {
          onSecurityViolation(validation.violations);
        }
        toast.error('Dados inseguros detectados e sanitizados.');
      }
    }

    if (sanitizeData) {
      processedData = sanitizeObject(data);
    }

    return this.supabase.from(table).update(processedData).match(match);
  }

  /**
   * Select com sanitização de parâmetros de filtro
   */
  async secureSelect(
    table: string,
    columns: string = '*',
    filters: Record<string, any> = {},
    options: { sanitizeFilters?: boolean } = {}
  ) {
    const { sanitizeFilters = true } = options;

    let query = this.supabase.from(table).select(columns);

    // Sanitizar filtros se habilitado
    const processedFilters = sanitizeFilters ? sanitizeObject(filters) : filters;

    // Aplicar filtros
    Object.entries(processedFilters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return query;
  }

  /**
   * RPC (Remote Procedure Call) seguro
   */
  async secureRpc<T extends Record<string, any>>(
    functionName: string,
    params: T = {} as T,
    options: { 
      validateSecurity?: boolean;
      sanitizeParams?: boolean;
      onSecurityViolation?: (violations: string[]) => void;
    } = {}
  ) {
    const { 
      validateSecurity = true, 
      sanitizeParams = true,
      onSecurityViolation 
    } = options;

    let processedParams = params;

    if (validateSecurity) {
      const validation = validateObjectSecurity(params);
      if (!validation.isValid) {
        console.warn(`Violações de segurança detectadas no RPC:`, validation.violations);
        if (onSecurityViolation) {
          onSecurityViolation(validation.violations);
        }
        toast.error('Parâmetros inseguros detectados e sanitizados.');
      }
    }

    if (sanitizeParams) {
      processedParams = sanitizeObject(params);
    }

    return this.supabase.rpc(functionName, processedParams);
  }

  /**
   * Acesso direto ao cliente Supabase para operações que não precisam de sanitização
   */
  get client() {
    return this.supabase;
  }
}

/**
 * Hook para usar o cliente Supabase seguro
 */
export function useSecureSupabase(supabaseClient: SupabaseClient) {
  return new SecureSupabaseClient(supabaseClient);
}

/**
 * Middleware para interceptar e sanitizar todas as operações do Supabase
 */
export function createSecureSupabaseMiddleware(supabaseClient: SupabaseClient) {
  const originalFrom = supabaseClient.from.bind(supabaseClient);
  const originalRpc = supabaseClient.rpc.bind(supabaseClient);

  // Interceptar operações from()
  supabaseClient.from = function(table: string) {
    const queryBuilder = originalFrom(table);
    
    // Interceptar insert
    const originalInsert = queryBuilder.insert.bind(queryBuilder);
    queryBuilder.insert = function(data: any) {
      const sanitizedData = Array.isArray(data) 
        ? data.map(item => sanitizeObject(item))
        : sanitizeObject(data);
      
      return originalInsert(sanitizedData);
    };

    // Interceptar update
    const originalUpdate = queryBuilder.update.bind(queryBuilder);
    queryBuilder.update = function(data: any) {
      const sanitizedData = sanitizeObject(data);
      return originalUpdate(sanitizedData);
    };

    return queryBuilder;
  };

  // Interceptar RPC
  supabaseClient.rpc = function(functionName: string, params?: any) {
    const sanitizedParams = params ? sanitizeObject(params) : params;
    return originalRpc(functionName, sanitizedParams);
  };

  return supabaseClient;
}