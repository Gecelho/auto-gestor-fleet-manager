import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthLoadingOverlayProps {
  message?: string;
  showBackground?: boolean;
}

export function AuthLoadingOverlay({ 
  message = "Verificando autenticação...", 
  showBackground = true 
}: AuthLoadingOverlayProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${
      showBackground 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800' 
        : 'bg-background'
    }`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full bg-primary/20"></div>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  );
}