import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface AuthFallbackProps {
  onRetry?: () => void;
}

export function AuthFallback({ onRetry }: AuthFallbackProps) {
  const handleReload = () => {
    window.location.reload();
  };

  const handleClearCache = () => {
    // Clear all storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    
    // Clear service worker cache if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      }).finally(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle>Problema de Conexão</CardTitle>
          <CardDescription>
            Não foi possível carregar a aplicação. Isso pode ser um problema temporário de conexão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={onRetry || handleReload} 
              className="w-full"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            
            <Button 
              onClick={handleClearCache} 
              className="w-full"
              variant="outline"
            >
              Limpar Cache e Recarregar
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            <p>Se o problema persistir:</p>
            <ul className="mt-2 space-y-1">
              <li>• Verifique sua conexão com a internet</li>
              <li>• Tente usar outro navegador</li>
              <li>• Desative extensões do navegador temporariamente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}