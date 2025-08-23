import React, { useState } from "react";
import { useUser, useUpdateUser, useCreateUserProfile } from "@/hooks/useUser";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Mail, Phone, Building, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function UserProfile() {
  const { user: authUser } = useAuth();
  const { data: userProfile, isLoading, error } = useUser();
  const updateUser = useUpdateUser();
  const createProfile = useCreateUserProfile();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    company_name: "",
  });

  // Initialize form data when userProfile loads
  React.useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || "",
        phone: userProfile.phone || "",
        company_name: userProfile.company_name || "",
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 UserProfile: handleSubmit iniciado');
    console.log('📋 UserProfile: formData:', formData);
    console.log('🔄 UserProfile: updateUser.isPending:', updateUser.isPending);
    
    try {
      console.log('🚀 UserProfile: Chamando updateUser.mutateAsync...');
      await updateUser.mutateAsync(formData);
      console.log('✅ UserProfile: updateUser.mutateAsync concluído');
      setIsEditing(false);
      console.log('🔒 UserProfile: Modo de edição desativado');
    } catch (error) {
      console.error('❌ UserProfile: Erro no handleSubmit:', error);
    }
  };

  const handleCreateProfile = async () => {
    try {
      await createProfile.mutateAsync();
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" text="Carregando perfil..." />
      </div>
    );
  }

  // If user profile doesn't exist, show create button
  if (error || !userProfile) {
    return (
      <div className="py-8 text-center space-y-6">
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Perfil não encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Parece que seu perfil ainda não foi criado. Clique no botão abaixo para criar.
            </p>
          </div>
        </div>
        <Button 
          onClick={handleCreateProfile}
          disabled={createProfile.isPending}
          className="w-full max-w-xs"
        >
          {createProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Perfil
        </Button>
      </div>
    );
  }

  const userInitials = userProfile.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const userAvatar = authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture;

  return (
    <>
      {/* Profile Content */}
      <div className="space-y-6 py-4 pb-24 sm:pb-20">
        {/* Profile Header */}
        <div className="flex items-center gap-3 sm:gap-4 pb-6 border-b">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarImage src={userAvatar} alt={userProfile.full_name || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg sm:text-xl">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold truncate">{userProfile.full_name || "Usuário"}</h2>
            <p className="text-sm text-muted-foreground truncate">{userProfile.email}</p>
            <div className="mt-2">
              <SubscriptionStatus showDetails={true} />
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={userProfile.email}
              disabled
              className="bg-muted/50 border-muted"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
              Email não pode ser alterado (vinculado à conta Google)
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              Nome Completo
            </Label>
            <Input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              disabled={!isEditing}
              placeholder="Seu nome completo"
              className={!isEditing ? "bg-muted/30 border-muted" : ""}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Telefone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              disabled={!isEditing}
              placeholder="(11) 99999-9999"
              className={!isEditing ? "bg-muted/30 border-muted" : ""}
            />
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company_name" className="flex items-center gap-2 text-sm font-medium">
              <Building className="h-4 w-4 text-muted-foreground" />
              Empresa (Opcional)
            </Label>
            <Input
              id="company_name"
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              disabled={!isEditing}
              placeholder="Nome da sua empresa"
              className={!isEditing ? "bg-muted/30 border-muted" : ""}
            />
          </div>

        </form>
        </div>

        {/* Profile Info */}
        <div className="pt-6 border-t space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Informações da Conta
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Membro desde</p>
                <p className="text-sm font-medium">
                  {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Última atualização</p>
                <p className="text-sm font-medium">
                  {new Date(userProfile.updated_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="fixed sm:absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t px-4 sm:px-6 py-3 sm:py-4 z-50">
        {!isEditing ? (
          <Button 
            type="button" 
            onClick={() => setIsEditing(true)}
            className="w-full"
            size="lg"
          >
            <User className="mr-2 h-4 w-4" />
            Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2 sm:gap-3">
            <Button 
              type="button"
              onClick={handleSubmit}
              disabled={updateUser.isPending}
              className="flex-1"
              size="lg"
            >
              {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <span className="hidden sm:inline">Salvar Alterações</span>
              <span className="sm:hidden">Salvar</span>
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                // Reset form data
                setFormData({
                  full_name: userProfile.full_name || "",
                  phone: userProfile.phone || "",
                  company_name: userProfile.company_name || "",
                });
              }}
              className="flex-1"
              size="lg"
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </>
  );
}