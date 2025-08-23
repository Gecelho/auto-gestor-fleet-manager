import React from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, MessageCircle, Crown, Clock, AlertTriangle } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface SubscriptionBlockerProps {
  children: React.ReactNode;
  feature?: "basic" | "premium" | "enterprise";
}

export const SubscriptionBlocker: React.FC<SubscriptionBlockerProps> = ({ 
  children, 
  feature = "basic" 
}) => {
  const { userProfile } = useAuth();
  const { data: subscription, isLoading, error } = useSubscription();

  // Se já temos dados do userProfile do AuthContext, use-os para evitar loading desnecessário
  const hasUserProfileData = userProfile && 
    userProfile.subscription_status && 
    userProfile.subscription_plan;

  // Só mostra loading se não temos dados do userProfile E ainda está carregando
  if (!hasUserProfileData && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Use dados do userProfile se disponíveis, senão use subscription do hook
  const subscriptionData = hasUserProfileData ? {
    subscription_status: userProfile.subscription_status,
    subscription_plan: userProfile.subscription_plan,
    subscription_expires_at: userProfile.subscription_expires_at,
    is_active: userProfile.subscription_status !== 'expired' && 
               userProfile.subscription_status !== 'suspended' &&
               (userProfile.subscription_expires_at ? 
                 new Date(userProfile.subscription_expires_at) > new Date() : true)
  } : subscription;

  // Se há erro ou não há dados de assinatura, bloqueia
  if (error || !subscriptionData) {
    return <SubscriptionBlockedScreen reason="error" />;
  }

  // Se a assinatura não está ativa, bloqueia
  if (!subscriptionData.is_active) {
    return <SubscriptionBlockedScreen reason="expired" subscription={subscriptionData} />;
  }

  // Se o plano não permite o recurso, bloqueia
  const planHierarchy = { basic: 1, premium: 2, enterprise: 3 };
  const userPlanLevel = planHierarchy[subscriptionData.subscription_plan as keyof typeof planHierarchy] || 0;
  const requiredPlanLevel = planHierarchy[feature];

  if (userPlanLevel < requiredPlanLevel) {
    return <SubscriptionBlockedScreen reason="plan" requiredPlan={feature} subscription={subscriptionData} />;
  }

  // Se tudo está ok, mostra o conteúdo
  return <>{children}</>;
};

interface SubscriptionBlockedScreenProps {
  reason: "expired" | "plan" | "error";
  subscription?: any;
  requiredPlan?: string;
}

const SubscriptionBlockedScreen: React.FC<SubscriptionBlockedScreenProps> = ({ 
  reason, 
  subscription,
  requiredPlan 
}) => {
  const handleWhatsAppContact = () => {
    let message = "";
    
    switch (reason) {
      case "expired":
        const expiredDate = subscription?.subscription_expires_at ? 
          new Date(subscription.subscription_expires_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : '';
        message = `Olá! Minha assinatura do Auto Gestor Fleet Manager expirou${expiredDate ? ` em ${expiredDate}` : ''} e gostaria de renovar. Pode me ajudar?`;
        break;
      case "plan":
        message = `Olá! Gostaria de fazer upgrade para o plano ${requiredPlan} do Auto Gestor Fleet Manager. Pode me ajudar?`;
        break;
      default:
        message = "Olá! Preciso de ajuda com minha assinatura do Auto Gestor Fleet Manager. Pode me ajudar?";
    }
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5519982000569?text=${encodedMessage}`, '_blank');
  };

  const getTitle = () => {
    switch (reason) {
      case "expired":
        return "Assinatura Expirada";
      case "plan":
        return "Upgrade Necessário";
      default:
        return "Acesso Restrito";
    }
  };

  const getDescription = () => {
    switch (reason) {
      case "expired":
        return "Sua assinatura expirou e você não pode mais acessar os recursos do sistema.";
      case "plan":
        return `Este recurso requer o plano ${requiredPlan?.toUpperCase()}. Faça upgrade para continuar.`;
      default:
        return "Não foi possível verificar sua assinatura. Entre em contato para resolver.";
    }
  };

  const getIcon = () => {
    switch (reason) {
      case "expired":
        return <Clock className="h-16 w-16 text-red-500" />;
      case "plan":
        return <Crown className="h-16 w-16 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-16 w-16 text-orange-500" />;
    }
  };

  const getExpiryInfo = () => {
    if (reason !== "expired" || !subscription?.subscription_expires_at) return null;
    
    const expiryDate = new Date(subscription.subscription_expires_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return (
      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          <strong>Expirou em:</strong> {expiryDate}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Card principal */}
        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
            <CardDescription className="text-base">
              {getDescription()}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {getExpiryInfo()}
            
            {subscription && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plano atual:</span>
                  <span className="font-medium capitalize">{subscription.subscription_plan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium capitalize ${
                    subscription.subscription_status === 'active' ? 'text-green-600' :
                    subscription.subscription_status === 'trial' ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    {subscription.subscription_status === 'active' ? 'Ativo' :
                     subscription.subscription_status === 'trial' ? 'Trial' :
                     subscription.subscription_status === 'expired' ? 'Expirado' :
                     'Suspenso'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={handleWhatsAppContact}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                {reason === "expired" ? "Renovar via WhatsApp" : 
                 reason === "plan" ? "Fazer Upgrade" : 
                 "Solicitar Suporte"}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Entre em contato conosco para {reason === "expired" ? "renovar sua assinatura" : 
                reason === "plan" ? "fazer upgrade do seu plano" : "resolver este problema"} 
                {" "}e continuar usando todas as funcionalidades.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações de segurança */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            🔒 Seus dados estão seguros e serão restaurados após a renovação
          </p>
        </div>
      </div>
    </div>
  );
};