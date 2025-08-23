import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Car, Shield, Chrome } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, signInWithGoogle } = useAuth();

  // ProtectedRoute check - log removido para produção

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">AutoGestor</CardTitle>
            <CardDescription className="text-base">
              Sistema de Gestão de Frota de Veículos
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Acesso Seguro</p>
                  <p className="text-xs text-muted-foreground">
                    Login protegido com Google OAuth
                  </p>
                </div>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Gerencie seus veículos, despesas, receitas e motoristas</p>
                <p>de forma simples e organizada.</p>
              </div>
            </div>

            <Button 
              onClick={signInWithGoogle}
              className="w-full h-12 text-base"
              size="lg"
            >
              <Chrome className="mr-2 h-5 w-5" />
              Entrar com Google
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Ao fazer login, você concorda com nossos termos de uso
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}