import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Chrome } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminAPI } from "@/lib/admin-api";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check if user is already logged in and verify admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (session?.access_token && user) {
        setIsVerifying(true);
        try {
          const data = await AdminAPI.verifyAdmin();
          if (data.isAdmin) {
            navigate('/painel-admin');
            return;
          }
        } catch (error) {
          console.error('Error verifying admin status:', error);
        } finally {
          setIsVerifying(false);
        }
      }
    };

    checkAdminStatus();
  }, [session, user, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/painel-admin`,
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
      setError(error.message || 'Erro ao fazer login com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setError(null);
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError(error.message || 'Erro ao fazer logout');
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
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
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
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
                  onClick={handleSignOut}
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