/**
 * Componente de Monitoramento de Segurança Avançado
 * Exibe informações sobre o status de segurança do sistema em tempo real
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, Activity, Lock, Zap } from 'lucide-react';
import { SecurityLogger, rateLimiter } from '@/lib/security';
import { supabaseInterceptor } from '@/lib/supabase-interceptor';
import { securityAudit, getSecurityMetrics, getCurrentThreatLevel, getSecurityScore } from '@/lib/security-audit';

interface SecurityEvent {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'critical';
  event: string;
  details: any;
}

interface SecurityMetrics {
  totalOperations: number;
  blockedOperations: number;
  rateLimitHits: number;
  securityLevel: 'safe' | 'suspicious' | 'dangerous';
  activeThreats: number;
}

interface SecurityMonitorProps {
  className?: string;
  showDetails?: boolean;
}

export const SecurityMonitor: React.FC<SecurityMonitorProps> = ({ 
  className = '',
  showDetails = false 
}) => {
  const [isVisible, setIsVisible] = useState(showDetails);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalOperations: 0,
    blockedOperations: 0,
    rateLimitHits: 0,
    securityLevel: 'safe',
    activeThreats: 0
  });
  const [summary, setSummary] = useState({
    total: 0,
    byLevel: { info: 0, warning: 0, error: 0, critical: 0 },
    topEvents: {} as Record<string, number>
  });

  useEffect(() => {
    const updateSecurityData = () => {
      const logs = SecurityLogger.getLogs();
      setEvents(logs.slice(-20)); // Últimos 20 eventos
      setSummary(SecurityLogger.getSecuritySummary());
      
      // Obter métricas do sistema de auditoria
      const auditMetrics = getSecurityMetrics();
      const threatLevel = getCurrentThreatLevel();
      const securityScore = getSecurityScore();
      
      // Calcular métricas combinadas
      const criticalEvents = logs.filter(log => log.level === 'critical').length + auditMetrics.violationsBySeverity.CRITICAL;
      const warningEvents = logs.filter(log => log.level === 'warning').length + auditMetrics.violationsBySeverity.HIGH;
      const rateLimitEvents = logs.filter(log => log.event.includes('rate_limit')).length;
      const blockedEvents = logs.filter(log => 
        log.event.includes('security_violation') || 
        log.event.includes('malicious') ||
        log.event.includes('blocked')
      ).length + auditMetrics.blockedViolations;
      
      let securityLevel: 'safe' | 'suspicious' | 'dangerous' = 'safe';
      switch (threatLevel) {
        case 'CRITICAL':
        case 'DANGEROUS':
          securityLevel = 'dangerous';
          break;
        case 'SUSPICIOUS':
          securityLevel = 'suspicious';
          break;
        default:
          securityLevel = 'safe';
      }
      
      setMetrics({
        totalOperations: logs.length + auditMetrics.totalViolations,
        blockedOperations: blockedEvents,
        rateLimitHits: rateLimitEvents,
        securityLevel,
        activeThreats: criticalEvents
      });
    };

    updateSecurityData();
    const interval = setInterval(updateSecurityData, 3000); // Atualizar a cada 3 segundos

    return () => clearInterval(interval);
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'critical': return 'bg-red-200 text-red-900 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'critical': return <XCircle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'safe': return 'text-green-600 bg-green-50 border-green-200';
      case 'suspicious': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'dangerous': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSecurityLevelIcon = (level: string) => {
    switch (level) {
      case 'safe': return <Shield className="w-4 h-4 text-green-600" />;
      case 'suspicious': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'dangerous': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!showDetails && !isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className={`shadow-lg transition-all duration-200 ${
            metrics.securityLevel === 'dangerous' 
              ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' 
              : metrics.securityLevel === 'suspicious'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
              : 'bg-white'
          }`}
        >
          {getSecurityLevelIcon(metrics.securityLevel)}
          <span className="ml-2">Segurança</span>
          {metrics.activeThreats > 0 && (
            <Badge className="ml-2 bg-red-500 text-white text-xs">
              {metrics.activeThreats}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`${showDetails ? '' : 'fixed bottom-4 right-4 z-50'} w-96 max-h-[500px] overflow-hidden ${className}`}>
      <Card className="shadow-xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSecurityLevelIcon(metrics.securityLevel)}
              <CardTitle className="text-sm">Monitor de Segurança</CardTitle>
              <Badge className={`text-xs px-2 py-1 ${getSecurityLevelColor(metrics.securityLevel)}`}>
                {metrics.securityLevel.toUpperCase()}
              </Badge>
            </div>
            {!showDetails && (
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            )}
          </div>
          <CardDescription className="text-xs">
            Monitoramento em tempo real • {metrics.totalOperations} operações
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Operações</span>
              </div>
              <p className="text-lg font-bold text-blue-800">{metrics.totalOperations}</p>
            </div>
            
            <div className="p-2 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-3 h-3 text-red-600" />
                <span className="text-xs font-medium text-red-700">Bloqueadas</span>
              </div>
              <p className="text-lg font-bold text-red-800">{metrics.blockedOperations}</p>
            </div>
            
            <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3 h-3 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-700">Rate Limit</span>
              </div>
              <p className="text-lg font-bold text-yellow-800">{metrics.rateLimitHits}</p>
            </div>
            
            <div className="p-2 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <span className="text-xs font-medium text-red-700">Ameaças</span>
              </div>
              <p className="text-lg font-bold text-red-800">{metrics.activeThreats}</p>
            </div>
          </div>

          {/* Nível de Segurança */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Nível de Segurança</span>
              <span className={`font-medium ${
                metrics.securityLevel === 'safe' ? 'text-green-600' :
                metrics.securityLevel === 'suspicious' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.securityLevel === 'safe' ? 'Seguro' :
                 metrics.securityLevel === 'suspicious' ? 'Suspeito' : 'Perigoso'}
              </span>
            </div>
            <Progress 
              value={
                metrics.securityLevel === 'safe' ? 100 :
                metrics.securityLevel === 'suspicious' ? 60 : 20
              }
              className="h-2"
            />
          </div>

          {/* Resumo de Eventos */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex flex-col items-center p-2 bg-blue-50 rounded border border-blue-200">
              <CheckCircle className="w-4 h-4 text-blue-500 mb-1" />
              <span className="font-medium text-blue-700">{summary.byLevel.info}</span>
              <span className="text-blue-600">Info</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-yellow-50 rounded border border-yellow-200">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mb-1" />
              <span className="font-medium text-yellow-700">{summary.byLevel.warning}</span>
              <span className="text-yellow-600">Avisos</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-red-50 rounded border border-red-200">
              <XCircle className="w-4 h-4 text-red-500 mb-1" />
              <span className="font-medium text-red-700">{summary.byLevel.error}</span>
              <span className="text-red-600">Erros</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-red-100 rounded border border-red-300">
              <XCircle className="w-4 h-4 text-red-700 mb-1" />
              <span className="font-medium text-red-800">{summary.byLevel.critical}</span>
              <span className="text-red-700">Críticos</span>
            </div>
          </div>

          {/* Eventos Recentes */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <h4 className="text-xs font-medium text-gray-700 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Eventos Recentes
            </h4>
            {events.length === 0 ? (
              <div className="text-center py-4">
                <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Sistema seguro - nenhum evento</p>
              </div>
            ) : (
              events.map((event, index) => (
                <div key={index} className={`flex items-start gap-2 p-2 rounded border text-xs ${
                  event.level === 'critical' ? 'bg-red-50 border-red-200' :
                  event.level === 'error' ? 'bg-red-50 border-red-200' :
                  event.level === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {getLevelIcon(event.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs px-1 py-0 ${getLevelColor(event.level)}`}>
                        {event.level.toUpperCase()}
                      </Badge>
                      <span className="text-gray-500">
                        {event.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-700 truncate font-medium">{event.event}</p>
                    {event.details && Object.keys(event.details).length > 0 && (
                      <p className="text-gray-500 text-xs mt-1 truncate">
                        {JSON.stringify(event.details).substring(0, 60)}...
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Proteções Ativas */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700">Proteções Ativas</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1 text-green-600">
                <Shield className="w-3 h-3" />
                <span>Sanitização XSS</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <Shield className="w-3 h-3" />
                <span>Rate Limiting</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <Shield className="w-3 h-3" />
                <span>Validação Input</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <Shield className="w-3 h-3" />
                <span>SQL Protection</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              onClick={() => {
                SecurityLogger.clearLogs();
                setEvents([]);
                setMetrics({
                  totalOperations: 0,
                  blockedOperations: 0,
                  rateLimitHits: 0,
                  securityLevel: 'safe',
                  activeThreats: 0
                });
              }}
              variant="outline"
              size="sm"
              className="text-xs flex-1"
            >
              Limpar
            </Button>
            <Button
              onClick={() => {
                const logs = SecurityLogger.getLogs();
                const exportData = {
                  timestamp: new Date().toISOString(),
                  metrics,
                  summary,
                  events: logs
                };
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              variant="outline"
              size="sm"
              className="text-xs flex-1"
            >
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};