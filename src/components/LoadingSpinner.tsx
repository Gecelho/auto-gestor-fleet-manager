import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  timeout?: number;
  onTimeout?: () => void;
  showText?: boolean;
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  size = "md", 
  className, 
  text, 
  timeout = 2000,
  onTimeout,
  showText = true,
  fullScreen = false
}: LoadingSpinnerProps) {
  const [isTimeout, setIsTimeout] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeout / 1000);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  useEffect(() => {
    if (timeout <= 0) return;

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Timeout handler
    const timeoutId = setTimeout(() => {
      setIsTimeout(true);
      if (onTimeout) {
        onTimeout();
      }
    }, timeout);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(countdownInterval);
    };
  }, [timeout, onTimeout]);

  const containerClass = fullScreen 
    ? "min-h-screen bg-background flex items-center justify-center"
    : cn("flex flex-col items-center justify-center py-8", className);

  if (isTimeout) {
    return (
      <div className={containerClass}>
        <div className="text-center space-y-4">
          <div className="text-yellow-600 dark:text-yellow-400">
            ⚠️ Carregamento demorou mais que o esperado
          </div>
          <p className="text-muted-foreground text-sm">
            Tentando recarregar os dados...
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Recarregar Página
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size]
      )} />
      {showText && text && (
        <p className="text-muted-foreground mt-4 text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
          </div>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}