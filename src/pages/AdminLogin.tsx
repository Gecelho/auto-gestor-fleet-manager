import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Chrome } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, signOut } = useAuth();
  const { isAdmin, loading: adminLoading, error: adminError, verifyAdmin, clearError } = useAdminAuth();
  const [loading, setLoading] = useState(false);

  // Navigate to admin panel when user is verified as admin
  useEffect(() => {
    if (isAdmin === true) {
      navigate('/painel-admin');
    }
  }, [isAdmin, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    clearError();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin-login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
    } finally {
      setLoading(false);
    }
  };



  if (adminLoading) {
    const urlParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const isOAuthCallback = urlParams.has('code') || hashParams.has('access_token');
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
              <div className="space-y-2">
                <p className="font-medium">
                  {isOAuthCallback ? 'Processando login...' : 'Verificando permissões...'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isOAuthCallback 
                    ? 'Aguarde enquanto validamos suas credenciais de administrador.'
                    : 'Verificando se você tem acesso ao painel administrativo.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Painel Administrativo</CardTitle>
          <CardDescription>
            Acesso restrito para administradores autorizados
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {adminError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {adminError}
                {adminError.includes('permissões de administrador') && (
                  <div className="mt-2">
                    <Button 
                      onClick={clearError}
                      variant="outline"
                      size="sm"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {user ? (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Você está logado como <strong>{user.email}</strong>, mas não tem permissões de administrador.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={signOut}
                  variant="outline"
                  className="w-full"
                >
                  Fazer logout e tentar com outra conta
                </Button>
                
                <Button 
                  onClick={() => navigate('/')}
                  variant="ghost"
                  className="w-full"
                >
                  Voltar ao sistema principal
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Faça login com sua conta Google autorizada para acessar o painel administrativo.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                <Chrome className="w-5 h-5 mr-2" />
                {loading ? 'Conectando...' : 'Entrar com Google'}
              </Button>

              <div className="text-center">
                <Button 
                  onClick={() => navigate('/')}
                  variant="ghost"
                  size="sm"
                >
                  Voltar ao sistema principal
                </Button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>🔒 Acesso seguro com autenticação Google</p>
              <p>🛡️ Verificação server-side de permissões</p>
              <p>📝 Todas as ações são auditadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;