import React from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Clock, Crown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ 
  showDetails = true, 
  className 
}) => {
  const { data: subscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-xs text-red-600 dark:text-red-400">Erro na assinatura</span>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!subscription.is_active) return "bg-red-500";
    if (subscription.is_expiring_soon) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusText = () => {
    if (!subscription.is_active) {
      return subscription.subscription_status === 'expired' ? 'Expirada' : 'Inativa';
    }
    if (subscription.subscription_status === 'trial') return 'Trial';
    return 'Ativa';
  };

  const getStatusIcon = () => {
    if (!subscription.is_active) return <AlertTriangle className="h-3 w-3" />;
    if (subscription.subscription_status === 'trial') return <Clock className="h-3 w-3" />;
    if (subscription.subscription_plan === 'premium') return <Crown className="h-3 w-3" />;
    if (subscription.subscription_plan === 'enterprise') return <Shield className="h-3 w-3" />;
    return null;
  };

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getExpiryText = () => {
    if (!subscription.subscription_expires_at) {
      return null;
    }

    const expiryDate = formatExpiryDate(subscription.subscription_expires_at);
    
    // Se a assinatura não está ativa (expirada ou suspensa)
    if (!subscription.is_active) {
      return `Expirou em ${expiryDate}`;
    }

    // Se não temos days_until_expiry, só mostra a data
    if (!subscription.days_until_expiry) {
      return `Expira em ${expiryDate}`;
    }

    const days = subscription.days_until_expiry;

    if (days <= 0) {
      return `Expirou em ${expiryDate}`;
    }

    if (days === 1) {
      return `Expira amanhã (${expiryDate})`;
    }

    if (days <= 7) {
      return `Expira em ${days} dias (${expiryDate})`;
    }

    if (days <= 30) {
      return `Expira em ${days} dias`;
    }

    return `Expira em ${expiryDate}`;
  };

  const getPlanBadgeVariant = () => {
    switch (subscription.subscription_plan) {
      case 'enterprise': return 'default';
      case 'premium': return 'secondary';
      default: return 'outline';
    }
  };

  const getPlanText = () => {
    switch (subscription.subscription_plan) {
      case 'enterprise': return 'Enterprise';
      case 'premium': return 'Premium';
      default: return 'Básico';
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      {/* Status Principal */}
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", getStatusColor())}></div>
        <span className={cn(
          "text-xs font-medium",
          subscription.is_active 
            ? subscription.is_expiring_soon 
              ? "text-yellow-600 dark:text-yellow-400" 
              : "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        )}>
          {getStatusText()}
        </span>
        {getStatusIcon() && (
          <span className={cn(
            subscription.is_active 
              ? subscription.is_expiring_soon 
                ? "text-yellow-600 dark:text-yellow-400" 
                : "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          )}>
            {getStatusIcon()}
          </span>
        )}
      </div>

      {/* Detalhes da Assinatura */}
      {showDetails && (
        <div className="space-y-1">
          {/* Plano */}
          <div className="flex items-center gap-2">
            <Badge variant={getPlanBadgeVariant()} className="text-xs px-2 py-0">
              {getPlanText()}
            </Badge>
          </div>

          {/* Data de Expiração */}
          {subscription.subscription_expires_at && (
            <div className="flex items-center gap-1">
              <Calendar className={cn(
                "h-3 w-3",
                !subscription.is_active 
                  ? "text-red-600 dark:text-red-400"
                  : subscription.is_expiring_soon 
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs",
                !subscription.is_active 
                  ? "text-red-600 dark:text-red-400 font-medium"
                  : subscription.is_expiring_soon 
                    ? "text-yellow-600 dark:text-yellow-400 font-medium" 
                    : "text-muted-foreground"
              )}>
                {getExpiryText()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};