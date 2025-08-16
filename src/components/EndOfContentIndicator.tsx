interface EndOfContentIndicatorProps {
  message?: string;
  className?: string;
}

export function EndOfContentIndicator({ 
  message = "Fim dos dados", 
  className = "" 
}: EndOfContentIndicatorProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className="flex items-center space-x-3 text-muted-foreground">
        <div className="h-px bg-border w-16"></div>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <div className="h-px bg-border w-16"></div>
      </div>
      <p className="text-sm text-muted-foreground mt-3 font-medium">{message}</p>
    </div>
  );
}