import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Car, Shield, Users, BarChart3, Chrome } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Erro ao fazer login",
        description: "Não foi possível conectar com o Google. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 h-full">
        {/* Left Side - Features */}
        <div className="flex flex-col justify-center p-8 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Controle Financeiro</h3>
                <p className="text-sm text-muted-foreground">Acompanhe receitas e despesas em tempo real</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Gestão de Motoristas</h3>
                <p className="text-sm text-muted-foreground">Cadastre e gerencie informações dos condutores</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Frota Organizada</h3>
                <p className="text-sm text-muted-foreground">Mantenha todos os veículos organizados e atualizados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Login */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-8">
            {/* Logo and Brand */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Car className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Auto Gestor</h1>
                <p className="text-muted-foreground">
                  Sua plataforma de gestão de frota
                </p>
              </div>
            </div>

            {/* Login Card */}
            <Card className="border-0 shadow-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
              <CardHeader className="text-center space-y-2 pb-4">
                <CardTitle className="text-xl">Bem-vindo</CardTitle>
                <CardDescription>
                  Entre com sua conta Google para continuar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md"
                  variant="outline"
                >
                  {isLoading ? (
                    <LoadingSpinner className="w-5 h-5 mr-3" />
                  ) : (
                    <Chrome className="w-5 h-5 mr-3 text-blue-500" />
                  )}
                  {isLoading ? 'Conectando...' : 'Continuar com Google'}
                </Button>

                {/* Security Note */}
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Seus dados estão protegidos</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Side - Stats */}
        <div className="flex flex-col justify-center p-8 space-y-8">
          <div className="space-y-6">
            <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Seguro e Confiável</div>
            </div>
            
            <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-green-600">24/7</div>
              <div className="text-sm text-muted-foreground">Acesso aos seus dados</div>
            </div>
            
            <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-blue-600">∞</div>
              <div className="text-sm text-muted-foreground">Veículos ilimitados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex items-center justify-center h-full p-4">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo and Brand */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                <Car className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Auto Gestor</h1>
              <p className="text-muted-foreground">
                Gerencie sua frota com facilidade
              </p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
            <CardHeader className="text-center space-y-2 pb-4">
              <CardTitle className="text-xl">Bem-vindo</CardTitle>
              <CardDescription>
                Entre com sua conta Google para continuar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md"
                variant="outline"
              >
                {isLoading ? (
                  <LoadingSpinner className="w-5 h-5 mr-3" />
                ) : (
                  <Chrome className="w-5 h-5 mr-3 text-blue-500" />
                )}
                {isLoading ? 'Conectando...' : 'Continuar com Google'}
              </Button>

              {/* Security Note */}
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Seus dados estão protegidos</span>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Ao continuar, você concorda com nossos termos de uso
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;