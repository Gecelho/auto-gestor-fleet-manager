/**
 * Middleware Global de Segurança do Next.js
 * Este arquivo é executado ANTES de qualquer API route e não pode ser contornado
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateServerSecurity, logSecurityEvent } from '@/lib/server-security';

// Configurações que não podem ser alteradas pelo cliente
const SECURITY_CONFIG = {
  // Headers de segurança obrigatórios
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self'; object-src 'none'; child-src 'none'; worker-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
  },
  
  // Rate limiting por IP
  RATE_LIMITS: new Map<string, { count: number; resetTime: number }>(),
  
  // Configurações por endpoint
  ENDPOINT_CONFIG: {
    '/api/cars': {
      maxRequests: 10,
      windowMs: 60000,
      fieldMappings: {
        name: 'name',
        plate: 'plate',
        purchase_value: 'price',
        payment_method: 'name',
        mileage: 'mileage',
        notes: 'notes'
      }
    },
    '/api/expenses': {
      maxRequests: 15,
      windowMs: 60000,
      fieldMappings: {
        description: 'description',
        amount: 'price',
        category: 'name'
      }
    },
    '/api/rentals': {
      maxRequests: 8,
      windowMs: 60000,
      fieldMappings: {
        customer_name: 'name',
        customer_document: 'document',
        customer_phone: 'phone',
        daily_rate: 'price'
      }
    }
  }
};

/**
 * Rate limiting que não pode ser contornado
 */
function checkRateLimit(ip: string, endpoint: string): { allowed: boolean; remaining: number } {
  const config = SECURITY_CONFIG.ENDPOINT_CONFIG[endpoint as keyof typeof SECURITY_CONFIG.ENDPOINT_CONFIG];
  const maxRequests = config?.maxRequests || 20;
  const windowMs = config?.windowMs || 60000;
  
  const key = `${ip}-${endpoint}`;
  const now = Date.now();
  const record = SECURITY_CONFIG.RATE_LIMITS.get(key);
  
  if (!record || now > record.resetTime) {
    SECURITY_CONFIG.RATE_LIMITS.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Detectar padrões de ataque
 */
function detectAttackPatterns(req: NextRequest): string[] {
  const attacks: string[] = [];
  const url = req.url.toLowerCase();
  const userAgent = req.headers.get('user-agent')?.toLowerCase() || '';
  
  // Detectar tentativas de SQL injection na URL
  if (/(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b)/i.test(url)) {
    attacks.push('SQL_INJECTION_URL');
  }
  
  // Detectar tentativas de XSS na URL
  if (/<script|javascript:|on\w+=/i.test(url)) {
    attacks.push('XSS_URL');
  }
  
  // Detectar bots maliciosos
  const maliciousBots = ['sqlmap', 'nikto', 'nmap', 'masscan', 'zap', 'burp'];
  if (maliciousBots.some(bot => userAgent.includes(bot))) {
    attacks.push('MALICIOUS_BOT');
  }
  
  // Detectar tentativas de path traversal
  if (/\.\.\//g.test(url) || /\.\.\\/g.test(url)) {
    attacks.push('PATH_TRAVERSAL');
  }
  
  return attacks;
}

/**
 * Middleware principal
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Aplicar apenas para rotas de API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  try {
    // 1. Detectar padrões de ataque
    const attackPatterns = detectAttackPatterns(request);
    if (attackPatterns.length > 0) {
      logSecurityEvent('critical', 'attack_patterns_detected', {
        patterns: attackPatterns,
        url: request.url,
        ip,
        userAgent
      }, request);
      
      return NextResponse.json(
        { error: 'Acesso negado - atividade suspeita detectada' },
        { status: 403 }
      );
    }
    
    // 2. Verificar rate limiting
    const rateLimitCheck = checkRateLimit(ip, pathname);
    if (!rateLimitCheck.allowed) {
      logSecurityEvent('warning', 'rate_limit_exceeded', {
        ip,
        endpoint: pathname,
        userAgent
      }, request);
      
      return NextResponse.json(
        { 
          error: 'Muitas tentativas. Tente novamente mais tarde.',
          retryAfter: 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }
    
    // 3. Validar Content-Type para métodos com body
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        logSecurityEvent('warning', 'invalid_content_type', {
          contentType,
          method: request.method,
          ip
        }, request);
        
        return NextResponse.json(
          { error: 'Content-Type inválido. Use application/json' },
          { status: 400 }
        );
      }
    }
    
    // 4. Criar resposta com headers de segurança
    const response = NextResponse.next();
    
    // Adicionar headers de segurança
    Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Adicionar headers de rate limiting
    response.headers.set('X-RateLimit-Remaining', rateLimitCheck.remaining.toString());
    
    return response;
    
  } catch (error) {
    logSecurityEvent('error', 'middleware_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip,
      pathname
    }, request);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Configuração do matcher - define quais rotas o middleware deve processar
 */
export const config = {
  matcher: [
    // Aplicar a todas as rotas de API
    '/api/:path*',
    // Excluir arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// Limpar rate limits antigos periodicamente (executado no servidor)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of SECURITY_CONFIG.RATE_LIMITS.entries()) {
      if (now > record.resetTime) {
        SECURITY_CONFIG.RATE_LIMITS.delete(key);
      }
    }
  }, 60000); // Limpar a cada minuto
}