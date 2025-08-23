import React from 'react';
import { Loader2 } from 'lucide-react';

interface FastAuthLoaderProps {
  message?: string;
}

export function FastAuthLoader({ message = "Carregando..." }: FastAuthLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
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