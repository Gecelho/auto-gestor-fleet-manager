import React from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, MessageCircle, X } from "lucide-react";
import { useState } from "react";

export const SubscriptionWarning: React.FC = () => {
  const { data: subscription, isLoading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  // Não mostra nada se está carregando ou foi dispensado
  if (isLoading || dismissed || !subscription) {
    return null;
  }

  // Só mostra aviso se está expirando em breve (7 dias ou menos) e ainda ativo
  if (!subscription.is_expiring_soon || !subscription.is_active) {
    return null;
  }

  const handleWhatsAppContact = () => {
    const daysText = subscription.days_until_expiry === 1 ? 'amanhã' : `em ${subscription.days_until_expiry} dias`;
    const message = encodeURIComponent(
      `Olá! Minha assinatura do Auto Gestor Fleet Manager expira ${daysText} ` +
      `e gostaria de renovar. Pode me ajudar?`
    );
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
  };

  const getWarningText = () => {
    if (!subscription.days_until_expiry) return '';
    
    if (subscription.days_until_expiry === 1) {
      return 'Sua assinatura expira amanhã!';
    }
    
    if (subscription.days_until_expiry <= 3) {
      return `Sua assinatura expira em ${subscription.days_until_expiry} dias!`;
    }
    
    return `Sua assinatura expira em ${subscription.days_until_expiry} dias.`;
  };

  const getExpiryDate = () => {
    if (!subscription.subscription_expires_at) return '';
    
    return new Date(subscription.subscription_expires_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed top-20 left-4 right-4 z-40 sm:left-6 sm:right-6 lg:left-8 lg:right-8">
      <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/50 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {subscription.days_until_expiry && subscription.days_until_expiry <= 3 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <div className="space-y-2">
                <p className="font-medium">
                  {getWarningText()}
                </p>
                <p className="text-sm">
                  Data de expiração: <span className="font-medium">{getExpiryDate()}</span>
                </p>
                <p className="text-sm">
                  Renove agora para continuar usando todas as funcionalidades.
                </p>
              </div>
            </AlertDescription>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <Button
                onClick={handleWhatsAppContact}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Renovar via WhatsApp
              </Button>
              
              <Button
                onClick={() => setDismissed(true)}
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/20"
              >
                Lembrar depois
              </Button>
            </div>
          </div>
          
          <Button
            onClick={() => setDismissed(true)}
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-6 w-6 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
};