import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/hooks/useUser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, DollarSign, Users, BarChart3, CheckCircle, ArrowRight } from "lucide-react";

export function WelcomeDialog() {
  const { user: authUser } = useAuth();
  const { data: userProfile } = useUser();
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Show welcome dialog for new users
  useEffect(() => {
    if (authUser && userProfile) {
      // Check if user has already seen the welcome dialog
      const welcomeShownKey = `welcome_shown_${authUser.id}`;
      const hasSeenWelcome = localStorage.getItem(welcomeShownKey);
      
      if (!hasSeenWelcome) {
        // Check if user was created recently (within last 5 minutes)
        const createdAt = new Date(userProfile.created_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        
        if (diffMinutes < 5) {
          setShowWelcome(true);
        }
      }
    }
  }, [authUser, userProfile]);

  const welcomeSteps = [
    {
      title: "Bem-vindo ao AutoGestor! 🎉",
      description: "Sua conta foi criada com sucesso. Vamos te mostrar como usar o sistema.",
      icon: <CheckCircle className="h-12 w-12 text-green-500" />,
      content: (
        <div className="text-center space-y-4">
          <p className="text-lg">
            Olá, <strong>{userProfile?.full_name || "Usuário"}</strong>!
          </p>
          <p className="text-muted-foreground">
            Agora você pode gerenciar sua frota de veículos de forma completa e organizada.
          </p>
        </div>
      )
    },
    {
      title: "Gerencie seus Veículos 🚗",
      description: "Cadastre e acompanhe todos os seus carros",
      icon: <Car className="h-12 w-12 text-blue-500" />,
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Car className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium">Cadastro Completo</p>
              <p className="text-sm text-muted-foreground">Nome, placa, valor, fotos e mais</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium">Acompanhamento</p>
              <p className="text-sm text-muted-foreground">Status, quilometragem e histórico</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Controle Financeiro 💰",
      description: "Monitore despesas e receitas de cada veículo",
      icon: <DollarSign className="h-12 w-12 text-green-500" />,
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">Despesas</p>
              <p className="text-sm text-muted-foreground">Manutenção, documentos, seguro</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">Receitas</p>
              <p className="text-sm text-muted-foreground">Aluguel, vendas e outros ganhos</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Gerencie Motoristas 👥",
      description: "Cadastre e organize seus funcionários",
      icon: <Users className="h-12 w-12 text-purple-500" />,
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <Users className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-medium">Cadastro de Motoristas</p>
              <p className="text-sm text-muted-foreground">Nome, telefone, CPF e endereço</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <Car className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-medium">Vinculação</p>
              <p className="text-sm text-muted-foreground">Associe motoristas aos veículos</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Pronto para começar! 🚀",
      description: "Tudo configurado. Comece adicionando seu primeiro veículo.",
      icon: <CheckCircle className="h-12 w-12 text-green-500" />,
      content: (
        <div className="text-center space-y-4">
          <p className="text-lg">
            Seu sistema está pronto para uso!
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Comece cadastrando um veículo e depois adicione as despesas e receitas relacionadas a ele.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = welcomeSteps[currentStep];

  const markWelcomeAsSeen = () => {
    if (authUser) {
      const welcomeShownKey = `welcome_shown_${authUser.id}`;
      localStorage.setItem(welcomeShownKey, 'true');
    }
  };

  const handleNext = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      markWelcomeAsSeen();
      setShowWelcome(false);
    }
  };

  const handleSkip = () => {
    markWelcomeAsSeen();
    setShowWelcome(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      markWelcomeAsSeen();
      setShowWelcome(false);
    }
  };

  if (!showWelcome || !userProfile) return null;

  return (
    <Dialog open={showWelcome} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {currentStepData.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {currentStepData.icon}
          </div>

          {/* Content */}
          <div>
            <p className="text-center text-muted-foreground mb-4">
              {currentStepData.description}
            </p>
            {currentStepData.content}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-center space-x-2">
              {welcomeSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === currentStep
                      ? "bg-primary"
                      : index < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {currentStep + 1} de {welcomeSteps.length}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Pular
            </Button>
            <Button onClick={handleNext} className="flex-1">
              {currentStep < welcomeSteps.length - 1 ? (
                <>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Começar!"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}