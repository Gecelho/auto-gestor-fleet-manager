import { useState } from "react";
import { LogOut, ChevronDown, Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { SoundButton } from "@/components/ui/sound-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserProfile } from "./UserProfile";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useSounds } from "@/hooks/useSounds";

export function ProfileDropdown() {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings: soundSettings, toggleSounds, playSound } = useSounds();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: userProfile } = useUser();

  const handleSoundToggle = () => {
    const wasEnabled = soundSettings.enabled;
    
    // Se estava desabilitado e vai ser habilitado, toca um som de confirmação
    if (!wasEnabled) {
      // Primeiro ativa os sons
      toggleSounds();
      // Depois toca o som de confirmação usando requestAnimationFrame para garantir que o estado foi atualizado
      requestAnimationFrame(() => {
        playSound('success');
      });
    } else {
      // Se estava habilitado, apenas desativa
      toggleSounds();
    }
  };

  const handleSignOut = async () => {
    try {
      // Iniciando logout - logs removidos para produção
      
      await signOut();
      
      // Logout realizado com sucesso - log removido
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const userName = userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Função para formatar o status da assinatura
  const getSubscriptionStatus = () => {
    if (subscriptionLoading) {
      return {
        label: "Verificando...",
        detail: "Carregando",
        color: "gray",
        bgColor: "bg-gray-50 dark:bg-gray-900/20",
        borderColor: "border-gray-200 dark:border-gray-800",
        textColor: "text-gray-700 dark:text-gray-300",
        detailColor: "text-gray-600 dark:text-gray-400"
      };
    }

    if (!subscription || !subscription.is_active) {
      const expiredDate = subscription?.subscription_expires_at ? 
        new Date(subscription.subscription_expires_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        }) : null;
      
      return {
        label: "Conta Expirada",
        detail: expiredDate ? `Expirou em ${expiredDate}` : "Renovar agora",
        color: "red",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
        textColor: "text-red-700 dark:text-red-300",
        detailColor: "text-red-600 dark:text-red-400"
      };
    }

    if (subscription.is_expiring_soon && subscription.days_until_expiry) {
      const days = subscription.days_until_expiry;
      return {
        label: "Conta Ativa",
        detail: days === 1 ? "Expira amanhã" : `${days} dias restantes`,
        color: "yellow",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        textColor: "text-yellow-700 dark:text-yellow-300",
        detailColor: "text-yellow-600 dark:text-yellow-400"
      };
    }

    // Conta ativa sem problemas
    const expiryDate = subscription.subscription_expires_at ? 
      new Date(subscription.subscription_expires_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }) : null;

    return {
      label: "Conta Ativa",
      detail: expiryDate ? `Até ${expiryDate}` : "Ativa",
      color: "green",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
      textColor: "text-green-700 dark:text-green-300",
      detailColor: "text-green-600 dark:text-green-400"
    };
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative flex items-center gap-2 h-10 px-2 rounded-full hover:bg-accent">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-80 max-w-[calc(100vw-2rem)] mx-4 sm:mx-8" 
          align={isMobile ? "center" : "end"}
          side="bottom" 
          sideOffset={8}
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-3 p-2">
              {/* User Info Header */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </div>
              
              {/* Account Status */}
              <div className={`flex items-center justify-between p-2 rounded-lg border ${subscriptionStatus.bgColor} ${subscriptionStatus.borderColor}`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    subscriptionStatus.color === 'green' ? 'bg-green-500' :
                    subscriptionStatus.color === 'yellow' ? 'bg-yellow-500' :
                    subscriptionStatus.color === 'red' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className={`text-xs font-medium ${subscriptionStatus.textColor}`}>
                    {subscriptionStatus.label}
                  </span>
                </div>
                <span className={`text-xs ${subscriptionStatus.detailColor}`}>
                  {subscriptionStatus.detail}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Profile Option */}
          <DropdownMenuItem 
            onClick={() => setShowProfile(true)}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>
          
          {/* Settings Option */}
          <DropdownMenuItem 
            onClick={() => setShowSettings(true)}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Logout Option */}
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair da conta</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Tema */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tema da Aplicação</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>Claro</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <span>Escuro</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sons de Interação */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Efeitos Sonoros</Label>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {soundSettings.enabled ? (
                    <Volume2 className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-sm truncate">
                    Som ao clicar
                  </span>
                </div>
                <Switch
                  checked={soundSettings.enabled}
                  onCheckedChange={handleSoundToggle}
                  className="flex-shrink-0"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ative sons suaves de feedback para cliques e sucessos.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <SoundButton 
              variant="outline" 
              soundType="click"
              onClick={() => setShowSettings(false)}
            >
              Fechar
            </SoundButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] sm:max-h-[85vh] h-[100vh] sm:h-auto flex flex-col p-0 m-0 sm:m-4 rounded-none sm:rounded-lg">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meu Perfil
            </DialogTitle>
            <DialogDescription className="hidden sm:block">
              Gerencie suas informações pessoais e configurações da conta
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <UserProfile />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}