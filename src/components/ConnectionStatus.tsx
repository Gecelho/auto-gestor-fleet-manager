import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, AlertTriangle } from "lucide-react";

export function ConnectionStatus() {
  const { isOnline, connectionQuality } = useConnectionStatus();

  if (isOnline && connectionQuality === 'good') {
    return null; // Don't show anything when connection is good
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert variant={isOnline ? "default" : "destructive"}>
        {isOnline ? (
          connectionQuality === 'poor' ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Wifi className="h-4 w-4" />
          )
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <AlertDescription>
          {!isOnline 
            ? "Sem conexão com a internet"
            : connectionQuality === 'poor' 
            ? "Conexão lenta detectada"
            : "Verificando conexão..."
          }
        </AlertDescription>
      </Alert>
    </div>
  );
}