/**
 * Configurações de segurança centralizadas
 */

export const SECURITY_CONFIG = {
  // Configurações de sanitização
  SANITIZATION: {
    // Máximo de caracteres permitidos por campo
    MAX_LENGTHS: {
      SHORT_TEXT: 100,
      MEDIUM_TEXT: 255,
      LONG_TEXT: 1000,
      DESCRIPTION: 2000,
      NAME: 50,
      EMAIL: 254,
      PHONE: 20,
      PLATE: 10,
      DOCUMENT: 20
    },

    // Padrões de caracteres permitidos
    ALLOWED_PATTERNS: {
      ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
      ALPHANUMERIC_EXTENDED: /^[a-zA-Z0-9\s\-\.\,\!\?\(\)]+$/,
      ALPHANUMERIC_PORTUGUESE: /^[a-zA-Z0-9\s\-\.\,\!\?\(\)àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]+$/,
      NUMERIC: /^[0-9]+$/,
      DECIMAL: /^[0-9\.\,]+$/,
      PLATE: /^[A-Z0-9\-]+$/,
      EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      PHONE: /^[\+]?[0-9\s\-\(\)]+$/,
      DATE: /^\d{4}-\d{2}-\d{2}$/,
      TIME: /^\d{2}:\d{2}(:\d{2})?$/,
      URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
    }
  },

  // Configurações de CSRF
  CSRF: {
    TOKEN_LENGTH: 32,
    TOKEN_EXPIRY: 3600000, // 1 hora em millisegundos
    HEADER_NAME: 'X-CSRF-Token',
    COOKIE_NAME: '__csrf_token'
  },

  // Configurações de CSP (Content Security Policy)
  CSP: {
    DIRECTIVES: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      'font-src': ["'self'", "https://fonts.gstatic.com"],
      'img-src': ["'self'", "data:", "https:", "blob:"],
      'connect-src': ["'self'", "https://*.supabase.co", "https://api.whatsapp.com", "https://wa.me"],
      'media-src': ["'self'", "data:", "blob:"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    }
  },

  // Configurações de validação
  VALIDATION: {
    // Campos obrigatórios por formulário
    REQUIRED_FIELDS: {
      ADD_CAR: ['name', 'plate', 'purchase_value'],
      ADD_EXPENSE: ['description', 'value', 'date'],
      ADD_REVENUE: ['description', 'value', 'date'],
      USER_PROFILE: ['name', 'email']
    },

    // Regras de validação específicas
    RULES: {
      PASSWORD: {
        MIN_LENGTH: 8,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBERS: true,
        REQUIRE_SPECIAL_CHARS: true
      },
      EMAIL: {
        MAX_LENGTH: 254,
        REQUIRE_DOMAIN: true
      },
      PHONE: {
        MIN_LENGTH: 10,
        MAX_LENGTH: 15
      }
    }
  },

  // Lista de palavras/padrões proibidos
  BLOCKED_CONTENT: {
    // Scripts maliciosos
    SCRIPT_PATTERNS: [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /expression\s*\(/gi,
      /eval\s*\(/gi
    ],

    // Comandos de sistema
    SYSTEM_COMMANDS: [
      /rm\s+-rf/gi,
      /del\s+\/[sf]/gi,
      /format\s+c:/gi,
      /shutdown/gi,
      /reboot/gi,
      /halt/gi
    ],

    // Injeção SQL
    SQL_INJECTION: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\-\-|\#|\/\*|\*\/)/g,
      /(\'|\"|;|\||&)/g
    ],

    // Palavras ofensivas (adicione conforme necessário)
    OFFENSIVE_WORDS: [
      // Adicione palavras ofensivas específicas do seu contexto
    ]
  },

  // Configurações de rate limiting
  RATE_LIMITING: {
    FORM_SUBMISSIONS: {
      MAX_ATTEMPTS: 10,
      WINDOW_MS: 60000 // 1 minuto
    },
    LOGIN_ATTEMPTS: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 300000 // 5 minutos
    }
  },

  // Configurações de logging de segurança
  LOGGING: {
    ENABLED: true,
    LOG_LEVELS: ['error', 'warn', 'info'],
    EVENTS_TO_LOG: [
      'xss_attempt',
      'sql_injection_attempt',
      'csrf_violation',
      'rate_limit_exceeded',
      'malicious_input_detected',
      'sanitization_applied'
    ]
  }
};

/**
 * Configurações específicas por ambiente
 */
export const getSecurityConfigForEnvironment = (env: 'development' | 'production' | 'test') => {
  const baseConfig = { ...SECURITY_CONFIG };

  switch (env) {
    case 'development':
      // Em desenvolvimento, pode ser mais permissivo para debugging
      baseConfig.CSP.DIRECTIVES['script-src'].push("'unsafe-eval'");
      baseConfig.LOGGING.LOG_LEVELS.push('debug');
      break;

    case 'production':
      // Em produção, mais restritivo
      baseConfig.CSP.DIRECTIVES['script-src'] = baseConfig.CSP.DIRECTIVES['script-src'].filter(
        src => src !== "'unsafe-eval'"
      );
      baseConfig.RATE_LIMITING.FORM_SUBMISSIONS.MAX_ATTEMPTS = 5;
      break;

    case 'test':
      // Em testes, desabilitar algumas validações
      baseConfig.LOGGING.ENABLED = false;
      break;
  }

  return baseConfig;
};

/**
 * Validadores pré-configurados para campos comuns
 */
export const FIELD_VALIDATORS = {
  CAR_NAME: {
    maxLength: SECURITY_CONFIG.SANITIZATION.MAX_LENGTHS.MEDIUM_TEXT,
    allowedChars: SECURITY_CONFIG.SANITIZATION.ALLOWED_PATTERNS.ALPHANUMERIC_PORTUGUESE,
    required: true
  },
  
  CAR_PLATE: {
    maxLength: SECURITY_CONFIG.SANITIZATION.MAX_LENGTHS.PLATE,
    allowedChars: SECURITY_CONFIG.SANITIZATION.ALLOWED_PATTERNS.PLATE,
    required: true
  },
  
  CURRENCY_VALUE: {
    allowedChars: SECURITY_CONFIG.SANITIZATION.ALLOWED_PATTERNS.DECIMAL,
    required: true
  },
  
  DESCRIPTION: {
    maxLength: SECURITY_CONFIG.SANITIZATION.MAX_LENGTHS.DESCRIPTION,
    allowedChars: SECURITY_CONFIG.SANITIZATION.ALLOWED_PATTERNS.ALPHANUMERIC_PORTUGUESE,
    required: true
  },
  
  NOTES: {
    maxLength: SECURITY_CONFIG.SANITIZATION.MAX_LENGTHS.LONG_TEXT,
    allowedChars: SECURITY_CONFIG.SANITIZATION.ALLOWED_PATTERNS.ALPHANUMERIC_PORTUGUESE,
    required: false
  },
  
  EMAIL: {
    maxLength: SECURITY_CONFIG.SANITIZATION.MAX_LENGTHS.EMAIL,
    allowedChars: SECURITY_CONFIG.SANITIZATION.ALLOWED_PATTERNS.EMAIL,
    required: true
  },
  
  PHONE: {
    maxLength: SECURITY_CONFIG.SANITIZATION.MAX_LENGTHS.PHONE,
    allowedChars: SECURITY_CONFIG.SANITIZATION.ALLOWED_PATTERNS.PHONE,
    required: false
  }
};