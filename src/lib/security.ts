/**
 * Sistema de segurança avançado para prevenir XSS, injeção de código e outros ataques
 * Implementa proteções que não podem ser contornadas pelo cliente
 */

// Lista expandida de tags HTML perigosas que devem ser removidas
const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select',
  'button', 'link', 'meta', 'style', 'base', 'frame', 'frameset', 'applet',
  'bgsound', 'blink', 'body', 'head', 'html', 'ilayer', 'layer', 'xml',
  'svg', 'math', 'details', 'summary', 'marquee', 'audio', 'video', 'source',
  'track', 'canvas', 'map', 'area', 'noscript', 'template', 'slot'
];

// Lista expandida de atributos perigosos que devem ser removidos
const DANGEROUS_ATTRIBUTES = [
  'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown',
  'onmouseup', 'onkeydown', 'onkeyup', 'onkeypress', 'onfocus', 'onblur',
  'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onbeforeunload',
  'onresize', 'onscroll', 'ondrag', 'ondrop', 'oncontextmenu', 'oncut', 'oncopy',
  'onpaste', 'onabort', 'oncanplay', 'oncanplaythrough', 'ondurationchange',
  'onemptied', 'onended', 'onloadeddata', 'onloadedmetadata', 'onloadstart',
  'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange', 'onseeked',
  'onseeking', 'onstalled', 'onsuspend', 'ontimeupdate', 'onvolumechange',
  'onwaiting', 'onwheel', 'oninput', 'oninvalid', 'onsearch', 'ontoggle',
  'javascript:', 'vbscript:', 'data:', 'mocha:', 'livescript:', 'expression',
  'eval', 'behavior', 'binding', 'datasrc', 'datafld', 'dataformatas',
  'formaction', 'fscommand', 'seeksegmenttime'
];

// Padrões expandidos de código malicioso
const MALICIOUS_PATTERNS = [
  // JavaScript execution patterns
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<script[^>]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /data:application\/javascript/gi,
  /data:text\/javascript/gi,
  
  // Event handlers (mais abrangente)
  /on\w+\s*=/gi,
  /\bon[a-z]+\s*=/gi,
  
  // Expression and eval patterns
  /expression\s*\(/gi,
  /eval\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,
  /Function\s*\(/gi,
  /constructor\s*\(/gi,
  
  // Import and require patterns
  /import\s+/gi,
  /require\s*\(/gi,
  /import\s*\(/gi,
  
  // SQL injection patterns (mais específicos)
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT|TRUNCATE|GRANT|REVOKE)\b)/gi,
  /(UNION\s+(ALL\s+)?SELECT)/gi,
  /(OR\s+1\s*=\s*1)/gi,
  /(AND\s+1\s*=\s*1)/gi,
  /('|\"|;|--|\#|\/\*|\*\/)/g,
  
  // Command injection patterns
  /(\||&|;|`|\$\(|\${|&&|\|\|)/g,
  /(rm\s+-rf|del\s+\/[sf]|format\s+c:|shutdown|reboot|halt)/gi,
  
  // Path traversal
  /\.\.\//g,
  /\.\.\\/g,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
  
  // Protocol handlers
  /^(javascript|vbscript|data|mocha|livescript|file|ftp):/i,
  
  // HTML entities que podem ser usadas para bypass
  /&#x?[0-9a-f]+;?/gi,
  
  // CSS injection
  /expression\s*\(/gi,
  /url\s*\(\s*javascript:/gi,
  /url\s*\(\s*data:/gi,
  
  // Template injection
  /\{\{.*\}\}/g,
  /\$\{.*\}/g,
  /<\%.*\%>/g,
  
  // Server-side includes
  /<!--\s*#(include|exec|echo|config|set)/gi,
  
  // XML/XXE patterns
  /<!ENTITY/gi,
  /<!DOCTYPE.*\[/gi,
  
  // LDAP injection
  /(\*|\(|\)|\\|\||&)/g,
  
  // NoSQL injection
  /(\$where|\$ne|\$gt|\$lt|\$regex)/gi
];

/**
 * Sanitiza uma string removendo código malicioso
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  let sanitized = input;

  // Remove padrões maliciosos
  MALICIOUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove tags HTML perigosas
  DANGEROUS_TAGS.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    
    // Remove tags auto-fechadas
    const selfClosingRegex = new RegExp(`<${tag}[^>]*\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });

  // Remove atributos perigosos
  DANGEROUS_ATTRIBUTES.forEach(attr => {
    const regex = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Escape caracteres especiais HTML
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove caracteres de controle
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  return sanitized.trim();
}

/**
 * Sanitiza um objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item) : item
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}

/**
 * Valida se uma string contém código malicioso
 */
export function containsMaliciousCode(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  return MALICIOUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Valida se um objeto contém código malicioso
 */
export function validateObjectSecurity<T extends Record<string, any>>(obj: T): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  function checkValue(value: any, path: string) {
    if (typeof value === 'string') {
      if (containsMaliciousCode(value)) {
        violations.push(`Código malicioso detectado em: ${path}`);
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const [key, val] of Object.entries(value)) {
        checkValue(val, `${path}.${key}`);
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        checkValue(item, `${path}[${index}]`);
      });
    }
  }

  for (const [key, value] of Object.entries(obj)) {
    checkValue(value, key);
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Sanitiza parâmetros de URL
 */
export function sanitizeUrlParams(params: URLSearchParams): URLSearchParams {
  const sanitized = new URLSearchParams();
  
  for (const [key, value] of params.entries()) {
    sanitized.set(sanitizeString(key), sanitizeString(value));
  }
  
  return sanitized;
}

/**
 * Valida e sanitiza um valor de input
 */
export function validateAndSanitizeInput(
  value: string, 
  options: {
    maxLength?: number;
    allowedChars?: RegExp;
    required?: boolean;
  } = {}
): {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Verificar se é obrigatório
  if (options.required && (!value || value.trim().length === 0)) {
    errors.push('Campo obrigatório');
  }
  
  // Verificar comprimento máximo
  if (options.maxLength && value.length > options.maxLength) {
    errors.push(`Máximo de ${options.maxLength} caracteres permitidos`);
  }
  
  // Verificar caracteres permitidos
  if (options.allowedChars && !options.allowedChars.test(value)) {
    errors.push('Contém caracteres não permitidos');
  }
  
  // Verificar código malicioso
  if (containsMaliciousCode(value)) {
    errors.push('Código malicioso detectado');
  }
  
  const sanitizedValue = sanitizeString(value);
  
  return {
    isValid: errors.length === 0,
    sanitizedValue,
    errors
  };
}

/**
 * Middleware de segurança para formulários
 */
export function secureFormData<T extends Record<string, any>>(formData: T): {
  sanitizedData: T;
  securityReport: {
    isSecure: boolean;
    violations: string[];
    sanitizedFields: string[];
  };
} {
  const validation = validateObjectSecurity(formData);
  const sanitizedData = sanitizeObject(formData);
  
  // Identificar campos que foram sanitizados
  const sanitizedFields: string[] = [];
  
  function compareObjects(original: any, sanitized: any, path: string = '') {
    if (typeof original === 'string' && typeof sanitized === 'string') {
      if (original !== sanitized) {
        sanitizedFields.push(path);
      }
    } else if (typeof original === 'object' && original !== null && !Array.isArray(original)) {
      for (const key in original) {
        compareObjects(original[key], sanitized[key], path ? `${path}.${key}` : key);
      }
    }
  }
  
  compareObjects(formData, sanitizedData);
  
  return {
    sanitizedData,
    securityReport: {
      isSecure: validation.isValid,
      violations: validation.violations,
      sanitizedFields
    }
  };
}

/**
 * Gera um token CSRF simples
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida um token CSRF
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }
  
  // Comparação segura contra timing attacks
  if (token.length !== expectedToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Sistema de rate limiting para prevenir ataques de força bruta
 */
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  isAllowed(identifier: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  getRemainingAttempts(identifier: string, maxAttempts: number = 10): number {
    const record = this.attempts.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return maxAttempts;
    }
    return Math.max(0, maxAttempts - record.count);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Validação avançada de entrada com múltiplas camadas de segurança
 */
export function advancedInputValidation(
  input: string,
  options: {
    maxLength?: number;
    minLength?: number;
    allowedChars?: RegExp;
    blockedPatterns?: RegExp[];
    fieldType?: 'text' | 'email' | 'url' | 'numeric' | 'alphanumeric' | 'description';
    strictMode?: boolean;
  } = {}
): {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
  securityLevel: 'safe' | 'suspicious' | 'dangerous';
} {
  const errors: string[] = [];
  let securityLevel: 'safe' | 'suspicious' | 'dangerous' = 'safe';
  
  if (typeof input !== 'string') {
    input = String(input || '');
  }
  
  // Primeira camada: verificar código malicioso
  if (containsMaliciousCode(input)) {
    errors.push('Código malicioso detectado');
    securityLevel = 'dangerous';
  }
  
  // Segunda camada: verificar padrões suspeitos
  const suspiciousPatterns = [
    /[<>{}[\]\\|`~]/g,
    /\b(alert|confirm|prompt)\s*\(/gi,
    /\b(document|window|location)\./gi,
    /\b(innerHTML|outerHTML|eval)\b/gi
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      securityLevel = securityLevel === 'dangerous' ? 'dangerous' : 'suspicious';
      break;
    }
  }
  
  // Terceira camada: sanitização
  let sanitizedValue = sanitizeString(input);
  
  // Quarta camada: validações específicas por tipo
  if (options.fieldType) {
    const typeValidation = validateByFieldType(sanitizedValue, options.fieldType);
    if (!typeValidation.isValid) {
      errors.push(...typeValidation.errors);
    }
    sanitizedValue = typeValidation.sanitizedValue;
  }
  
  // Quinta camada: validações de comprimento
  if (options.minLength && sanitizedValue.length < options.minLength) {
    errors.push(`Mínimo de ${options.minLength} caracteres`);
  }
  
  if (options.maxLength && sanitizedValue.length > options.maxLength) {
    errors.push(`Máximo de ${options.maxLength} caracteres`);
    sanitizedValue = sanitizedValue.substring(0, options.maxLength);
  }
  
  // Sexta camada: validação de caracteres permitidos
  if (options.allowedChars && !options.allowedChars.test(sanitizedValue)) {
    errors.push('Contém caracteres não permitidos');
  }
  
  // Sétima camada: padrões bloqueados customizados
  if (options.blockedPatterns) {
    for (const pattern of options.blockedPatterns) {
      if (pattern.test(sanitizedValue)) {
        errors.push('Conteúdo não permitido detectado');
        break;
      }
    }
  }
  
  // Modo estrito: rejeitar qualquer coisa suspeita
  if (options.strictMode && securityLevel !== 'safe') {
    errors.push('Conteúdo rejeitado pelo modo de segurança estrito');
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue,
    errors,
    securityLevel
  };
}

/**
 * Validação específica por tipo de campo
 */
function validateByFieldType(value: string, fieldType: string): {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
} {
  const errors: string[] = [];
  let sanitizedValue = value;
  
  switch (fieldType) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        errors.push('Formato de email inválido');
      }
      // Remove caracteres perigosos específicos para email
      sanitizedValue = value.replace(/[<>"']/g, '');
      break;
      
    case 'url':
      try {
        if (value) {
          const url = new URL(value);
          if (!['http:', 'https:'].includes(url.protocol)) {
            errors.push('Apenas URLs HTTP/HTTPS são permitidas');
          }
        }
      } catch {
        if (value) {
          errors.push('URL inválida');
        }
      }
      break;
      
    case 'numeric':
      if (value && !/^\d+(\.\d+)?$/.test(value)) {
        errors.push('Apenas números são permitidos');
      }
      sanitizedValue = value.replace(/[^\d.]/g, '');
      break;
      
    case 'alphanumeric':
      sanitizedValue = value.replace(/[^a-zA-Z0-9\s]/g, '');
      break;
      
    case 'description':
      // Para descrições, permitir mais caracteres mas remover os perigosos
      sanitizedValue = value.replace(/[<>{}[\]\\|`~]/g, '');
      break;
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue,
    errors
  };
}

/**
 * Middleware de segurança para interceptar e validar todas as entradas
 */
export function securityMiddleware<T extends Record<string, any>>(
  data: T,
  fieldRules: Partial<Record<keyof T, {
    maxLength?: number;
    minLength?: number;
    fieldType?: 'text' | 'email' | 'url' | 'numeric' | 'alphanumeric' | 'description';
    required?: boolean;
    strictMode?: boolean;
  }>> = {}
): {
  isSecure: boolean;
  sanitizedData: T;
  securityReport: {
    totalFields: number;
    secureFields: number;
    suspiciousFields: string[];
    dangerousFields: string[];
    errors: Record<string, string[]>;
    overallSecurityLevel: 'safe' | 'suspicious' | 'dangerous';
  };
} {
  const sanitizedData = {} as T;
  const suspiciousFields: string[] = [];
  const dangerousFields: string[] = [];
  const errors: Record<string, string[]> = {};
  let overallSecurityLevel: 'safe' | 'suspicious' | 'dangerous' = 'safe';
  
  for (const [key, value] of Object.entries(data)) {
    const rules = fieldRules[key as keyof T] || {};
    const stringValue = String(value || '');
    
    // Verificar se é obrigatório
    if (rules.required && !stringValue.trim()) {
      errors[key] = ['Campo obrigatório'];
      sanitizedData[key as keyof T] = '' as T[keyof T];
      continue;
    }
    
    const validation = advancedInputValidation(stringValue, {
      maxLength: rules.maxLength,
      minLength: rules.minLength,
      fieldType: rules.fieldType,
      strictMode: rules.strictMode
    });
    
    sanitizedData[key as keyof T] = validation.sanitizedValue as T[keyof T];
    
    if (validation.errors.length > 0) {
      errors[key] = validation.errors;
    }
    
    if (validation.securityLevel === 'suspicious') {
      suspiciousFields.push(key);
      if (overallSecurityLevel === 'safe') {
        overallSecurityLevel = 'suspicious';
      }
    } else if (validation.securityLevel === 'dangerous') {
      dangerousFields.push(key);
      overallSecurityLevel = 'dangerous';
    }
  }
  
  return {
    isSecure: dangerousFields.length === 0 && Object.keys(errors).length === 0,
    sanitizedData,
    securityReport: {
      totalFields: Object.keys(data).length,
      secureFields: Object.keys(data).length - suspiciousFields.length - dangerousFields.length,
      suspiciousFields,
      dangerousFields,
      errors,
      overallSecurityLevel
    }
  };
}

/**
 * Gerador de hash seguro para verificação de integridade
 */
export async function generateSecureHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verificação de integridade de dados
 */
export async function verifyDataIntegrity(data: string, expectedHash: string): Promise<boolean> {
  const actualHash = await generateSecureHash(data);
  return actualHash === expectedHash;
}

/**
 * Logger de segurança para monitoramento
 */
export class SecurityLogger {
  private static logs: Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error' | 'critical';
    event: string;
    details: any;
    userAgent?: string;
    ip?: string;
  }> = [];
  
  static log(
    level: 'info' | 'warning' | 'error' | 'critical',
    event: string,
    details: any = {},
    userAgent?: string,
    ip?: string
  ) {
    this.logs.push({
      timestamp: new Date(),
      level,
      event,
      details,
      userAgent,
      ip
    });
    
    // Manter apenas os últimos 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // Log removido para produção - segurança em background
  }
  
  static getLogs(level?: 'info' | 'warning' | 'error' | 'critical') {
    return level ? this.logs.filter(log => log.level === level) : this.logs;
  }
  
  static clearLogs() {
    this.logs = [];
  }
  
  static getSecuritySummary() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = this.logs.filter(log => log.timestamp > last24h);
    
    return {
      total: recentLogs.length,
      byLevel: {
        info: recentLogs.filter(log => log.level === 'info').length,
        warning: recentLogs.filter(log => log.level === 'warning').length,
        error: recentLogs.filter(log => log.level === 'error').length,
        critical: recentLogs.filter(log => log.level === 'critical').length
      },
      topEvents: recentLogs.reduce((acc, log) => {
        acc[log.event] = (acc[log.event] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}