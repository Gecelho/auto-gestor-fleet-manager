/**
 * Componente de Alertas de Segurança
 * Exibe notificações em tempo real sobre tentativas de ataque
 */

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Shield, AlertTriangle, ShieldX, Zap } from 'lucide-react';
import { securityAudit, getCurrentThreatLevel, getSecurityScore } from '@/lib/security-audit';
import { SecurityLogger } from '@/lib/security';
import { cn } from '@/lib/utils';

interface SecurityAlertProps {
  className?: string;
  autoHide?: boolean;
  hideDelay?: number;
}

interface AlertData {
  id: string;
  type: 'violation' | 'threat_level' | 'rate_limit' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

export const SecurityAlert: React.FC<SecurityAlertProps> = ({
  className = '',
  autoHide = true,
  hideDelay = 5000
}) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [lastThreatLevel, setLastThreatLevel] = useState<string>('SAFE');
  const [lastSecurityScore, setLastSecurityScore] = useState<number>(100);

  useEffect(() => {
    const checkSecurityStatus = () => {
      const currentThreatLevel = getCurrentThreatLevel();
      const currentScore = getSecurityScore();
      const violations = securityAudit.getViolations(5); // Últimas 5 violações

      // Verificar mudança no nível de ameaça
      if (currentThreatLevel !== lastThreatLevel) {
        if (currentThreatLevel === 'CRITICAL' || currentThreatLevel === 'DANGEROUS') {
          addAlert({
            type: 'threat_level',
            severity: currentThreatLevel === 'CRITICAL' ? 'critical' : 'high',
            title: `Nível de Ameaça: ${currentThreatLevel}`,
            message: `O sistema detectou atividade suspeita. Score de segurança: ${currentScore}%`,
          });
        }
        setLastThreatLevel(currentThreatLevel);
      }

      // Verificar queda significativa no score
      if (currentScore < lastSecurityScore - 20) {
        addAlert({
          type: 'critical',
          severity: 'high',
          title: 'Score de Segurança Baixo',
          message: `Score caiu para ${currentScore}%. Múltiplas tentativas de ataque detectadas.`,
        });
      }
      setLastSecurityScore(currentScore);

      // Verificar novas violações críticas
      const recentCriticalViolations = violations.filter(v => 
        v.severity === 'CRITICAL' && 
        v.timestamp.getTime() > Date.now() - 30000 // Últimos 30 segundos
      );

      recentCriticalViolations.forEach(violation => {
        addAlert({
          type: 'violation',
          severity: 'critical',
          title: 'Tentativa de Ataque Bloqueada',
          message: `${violation.violationType.replace('_', ' ')} detectado no campo "${violation.fieldName}"`,
        });
      });
    };

    checkSecurityStatus();
    const interval = setInterval(checkSecurityStatus, 2000); // Verificar a cada 2 segundos

    return () => clearInterval(interval);
  }, [lastThreatLevel, lastSecurityScore]);

  const addAlert = (alertData: Omit<AlertData, 'id' | 'timestamp' | 'dismissed'>) => {
    const newAlert: AlertData = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      dismissed: false
    };

    setAlerts(prev => {
      // Evitar alertas duplicados
      const isDuplicate = prev.some(alert => 
        alert.type === newAlert.type && 
        alert.title === newAlert.title &&
        !alert.dismissed &&
        alert.timestamp.getTime() > Date.now() - 10000 // Últimos 10 segundos
      );

      if (isDuplicate) return prev;

      const updated = [newAlert, ...prev.slice(0, 4)]; // Manter apenas 5 alertas

      // Auto-hide se configurado
      if (autoHide && newAlert.severity !== 'critical') {
        setTimeout(() => {
          dismissAlert(newAlert.id);
        }, hideDelay);
      }

      return updated;
    });

    // Log do alerta
    SecurityLogger.log(
      alertData.severity === 'critical' ? 'critical' : 'warning',
      'security_alert_shown',
      {
        alertType: alertData.type,
        severity: alertData.severity,
        title: alertData.title
      }
    );
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));

    // Remover completamente após animação
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }, 300);
  };

  const dismissAllAlerts = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, dismissed: true })));
    setTimeout(() => setAlerts([]), 300);
  };

  const getAlertIcon = (type: AlertData['type'], severity: AlertData['severity']) => {
    if (severity === 'critical') return <ShieldX className="w-4 h-4" />;
    if (type === 'violation') return <AlertTriangle className="w-4 h-4" />;
    if (type === 'rate_limit') return <Zap className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  const getAlertColor = (severity: AlertData['severity']) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-800';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-800';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-blue-500 bg-blue-50 text-blue-800';
      default: return 'border-gray-500 bg-gray-50 text-gray-800';
    }
  };

  const getBadgeColor = (severity: AlertData['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const visibleAlerts = alerts.filter(alert => !alert.dismissed);

  if (visibleAlerts.length === 0) return null;

  return (
    <div className={cn('fixed top-4 right-4 z-50 space-y-2 max-w-md', className)}>
      {visibleAlerts.length > 1 && (
        <div className="flex justify-end">
          <Button
            onClick={dismissAllAlerts}
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Dispensar Todos
          </Button>
        </div>
      )}
      
      {visibleAlerts.map((alert) => (
        <Alert
          key={alert.id}
          className={cn(
            'shadow-lg border-2 transition-all duration-300 animate-in slide-in-from-right',
            getAlertColor(alert.severity),
            alert.dismissed && 'animate-out slide-out-to-right'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1">
              {getAlertIcon(alert.type, alert.severity)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{alert.title}</h4>
                  <Badge className={cn('text-xs', getBadgeColor(alert.severity))}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
                <AlertDescription className="text-xs">
                  {alert.message}
                </AlertDescription>
                <div className="text-xs opacity-70 mt-1">
                  {alert.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
            <Button
              onClick={() => dismissAlert(alert.id)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-black/10"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};