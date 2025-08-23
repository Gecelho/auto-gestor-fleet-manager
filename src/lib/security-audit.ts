/**
 * Sistema de Auditoria de Segurança
 * Registra e monitora todas as tentativas de violação de segurança
 */

import { SecurityLogger } from './security';
import { supabase } from '@/integrations/supabase/client';

export interface SecurityViolation {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  violationType: 'XSS_ATTEMPT' | 'SQL_INJECTION' | 'MALICIOUS_INPUT' | 'RATE_LIMIT_EXCEEDED' | 'CSRF_VIOLATION' | 'UNAUTHORIZED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  originalValue: string;
  sanitizedValue: string;
  fieldName: string;
  userAgent: string;
  ipAddress?: string;
  blocked: boolean;
  details: Record<string, any>;
}

export interface SecurityMetrics {
  totalViolations: number;
  violationsByType: Record<string, number>;
  violationsBySeverity: Record<string, number>;
  blockedViolations: number;
  uniqueAttackers: number;
  lastViolation?: Date;
  topTargetedFields: Array<{ field: string; count: number }>;
  attackPatterns: Array<{ pattern: string; count: number }>;
}

class SecurityAuditSystem {
  private violations: SecurityViolation[] = [];
  private sessionId: string;
  private maxViolationsInMemory = 1000;
  private suspiciousPatterns = new Map<string, number>();
  private blockedIPs = new Set<string>();
  private rateLimitCounters = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadViolationsFromStorage();
    this.startPeriodicCleanup();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadViolationsFromStorage(): void {
    try {
      const stored = localStorage.getItem('security_violations');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.violations = parsed.map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load security violations from storage:', error);
    }
  }

  private saveViolationsToStorage(): void {
    try {
      // Manter apenas as últimas 500 violações no localStorage
      const toSave = this.violations.slice(-500);
      localStorage.setItem('security_violations', JSON.stringify(toSave));
    } catch (error) {
      console.warn('Failed to save security violations to storage:', error);
    }
  }

  private startPeriodicCleanup(): void {
    // Limpar dados antigos a cada 5 minutos
    setInterval(() => {
      this.cleanupOldData();
    }, 5 * 60 * 1000);
  }

  private cleanupOldData(): void {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Limpar contadores de rate limit antigos
    for (const [key, data] of this.rateLimitCounters.entries()) {
      if (data.resetTime < now) {
        this.rateLimitCounters.delete(key);
      }
    }

    // Limpar padrões suspeitos antigos
    this.suspiciousPatterns.clear();

    // Manter apenas violações das últimas 24 horas na memória
    this.violations = this.violations.filter(v => v.timestamp.getTime() > oneDayAgo);

    // Salvar no storage
    this.saveViolationsToStorage();
  }

  public recordViolation(violation: Omit<SecurityViolation, 'id' | 'timestamp' | 'sessionId' | 'userAgent'>): void {
    const fullViolation: SecurityViolation = {
      ...violation,
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent
    };

    this.violations.push(fullViolation);

    // Manter limite de violações na memória
    if (this.violations.length > this.maxViolationsInMemory) {
      this.violations = this.violations.slice(-this.maxViolationsInMemory);
    }

    // Registrar padrão suspeito
    this.recordSuspiciousPattern(violation.originalValue);

    // Log da violação
    SecurityLogger.log(
      violation.severity.toLowerCase() as any,
      `security_violation_${violation.violationType.toLowerCase()}`,
      {
        source: violation.source,
        fieldName: violation.fieldName,
        blocked: violation.blocked,
        severity: violation.severity,
        details: violation.details
      }
    );

    // Salvar no storage
    this.saveViolationsToStorage();

    // Enviar para o servidor se for crítico
    if (violation.severity === 'CRITICAL') {
      this.reportCriticalViolation(fullViolation);
    }

    // Verificar se deve bloquear
    this.checkForBlocking(fullViolation);
  }

  private recordSuspiciousPattern(input: string): void {
    // Extrair padrões suspeitos
    const patterns = [
      /<script[^>]*>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi,
      /(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/gi,
      /--/g,
      /\/\*/g,
      /\*\//g,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];

    patterns.forEach(pattern => {
      const matches = input.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const count = this.suspiciousPatterns.get(match) || 0;
          this.suspiciousPatterns.set(match, count + 1);
        });
      }
    });
  }

  private async reportCriticalViolation(violation: SecurityViolation): Promise<void> {
    try {
      // Tentar enviar para o servidor
      await supabase.functions.invoke('security-alert', {
        body: {
          violation,
          sessionId: this.sessionId,
          timestamp: violation.timestamp.toISOString()
        }
      });
    } catch (error) {
      console.warn('Failed to report critical violation to server:', error);
    }
  }

  private checkForBlocking(violation: SecurityViolation): void {
    const userId = violation.userId || 'anonymous';
    const key = `${userId}_${violation.source}`;
    
    // Contar violações por usuário/fonte
    const now = Date.now();
    const resetTime = now + (15 * 60 * 1000); // 15 minutos
    
    const current = this.rateLimitCounters.get(key) || { count: 0, resetTime };
    current.count++;
    
    if (current.count > 5) { // Mais de 5 violações
      // Bloquear temporariamente
      this.blockedIPs.add(userId);
      
      SecurityLogger.log('critical', 'user_temporarily_blocked', {
        userId,
        source: violation.source,
        violationCount: current.count,
        blockDuration: '15 minutes'
      });
      
      // Remover bloqueio após 15 minutos
      setTimeout(() => {
        this.blockedIPs.delete(userId);
        SecurityLogger.log('info', 'user_unblocked', { userId });
      }, 15 * 60 * 1000);
    }
    
    this.rateLimitCounters.set(key, current);
  }

  public isBlocked(userId?: string): boolean {
    if (!userId) return false;
    return this.blockedIPs.has(userId);
  }

  public getViolations(limit?: number): SecurityViolation[] {
    const violations = [...this.violations].reverse(); // Mais recentes primeiro
    return limit ? violations.slice(0, limit) : violations;
  }

  public getMetrics(): SecurityMetrics {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const recentViolations = this.violations.filter(v => v.timestamp > oneHourAgo);

    const violationsByType: Record<string, number> = {};
    const violationsBySeverity: Record<string, number> = {};
    const fieldCounts: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    recentViolations.forEach(v => {
      violationsByType[v.violationType] = (violationsByType[v.violationType] || 0) + 1;
      violationsBySeverity[v.severity] = (violationsBySeverity[v.severity] || 0) + 1;
      fieldCounts[v.fieldName] = (fieldCounts[v.fieldName] || 0) + 1;
      if (v.userId) uniqueUsers.add(v.userId);
    });

    const topTargetedFields = Object.entries(fieldCounts)
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const attackPatterns = Array.from(this.suspiciousPatterns.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalViolations: recentViolations.length,
      violationsByType,
      violationsBySeverity,
      blockedViolations: recentViolations.filter(v => v.blocked).length,
      uniqueAttackers: uniqueUsers.size,
      lastViolation: recentViolations.length > 0 ? recentViolations[0].timestamp : undefined,
      topTargetedFields,
      attackPatterns
    };
  }

  public exportViolations(): string {
    const exportData = {
      sessionId: this.sessionId,
      exportTimestamp: new Date().toISOString(),
      violations: this.violations,
      metrics: this.getMetrics(),
      suspiciousPatterns: Array.from(this.suspiciousPatterns.entries()),
      blockedIPs: Array.from(this.blockedIPs)
    };

    return JSON.stringify(exportData, null, 2);
  }

  public clearViolations(): void {
    this.violations = [];
    this.suspiciousPatterns.clear();
    this.rateLimitCounters.clear();
    localStorage.removeItem('security_violations');
    
    SecurityLogger.log('info', 'security_violations_cleared', {
      sessionId: this.sessionId,
      clearedAt: new Date().toISOString()
    });
  }

  public getSecurityScore(): number {
    const metrics = this.getMetrics();
    let score = 100;

    // Reduzir score baseado em violações
    score -= Math.min(metrics.totalViolations * 2, 50);
    score -= Math.min(metrics.violationsBySeverity.CRITICAL * 10, 30);
    score -= Math.min(metrics.violationsBySeverity.HIGH * 5, 20);
    score -= Math.min(metrics.uniqueAttackers * 3, 15);

    return Math.max(score, 0);
  }

  public getThreatLevel(): 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' | 'CRITICAL' {
    const score = this.getSecurityScore();
    const metrics = this.getMetrics();

    if (metrics.violationsBySeverity.CRITICAL > 0) return 'CRITICAL';
    if (score < 30) return 'DANGEROUS';
    if (score < 60) return 'SUSPICIOUS';
    return 'SAFE';
  }
}

// Instância singleton
export const securityAudit = new SecurityAuditSystem();

// Função helper para registrar violações facilmente
export function recordSecurityViolation(
  violationType: SecurityViolation['violationType'],
  severity: SecurityViolation['severity'],
  source: string,
  fieldName: string,
  originalValue: string,
  sanitizedValue: string,
  blocked: boolean = true,
  details: Record<string, any> = {}
): void {
  securityAudit.recordViolation({
    violationType,
    severity,
    source,
    fieldName,
    originalValue,
    sanitizedValue,
    blocked,
    details
  });
}

// Função para verificar se um usuário está bloqueado
export function isUserBlocked(userId?: string): boolean {
  return securityAudit.isBlocked(userId);
}

// Função para obter métricas de segurança
export function getSecurityMetrics(): SecurityMetrics {
  return securityAudit.getMetrics();
}

// Função para obter o nível de ameaça atual
export function getCurrentThreatLevel(): 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' | 'CRITICAL' {
  return securityAudit.getThreatLevel();
}

// Função para obter o score de segurança
export function getSecurityScore(): number {
  return securityAudit.getSecurityScore();
}