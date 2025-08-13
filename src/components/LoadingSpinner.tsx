import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size]
      )} />
      {text && (
        <p className="text-muted-foreground mt-4 text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="card-modern p-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-muted rounded-xl loading-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded loading-shimmer" />
            <div className="h-3 bg-muted rounded w-2/3 loading-shimmer" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-muted rounded-lg loading-shimmer" />
          <div className="h-16 bg-muted rounded-lg loading-shimmer" />
          <div className="h-16 bg-muted rounded-lg loading-shimmer" />
        </div>
      </div>
    </div>
  );
}