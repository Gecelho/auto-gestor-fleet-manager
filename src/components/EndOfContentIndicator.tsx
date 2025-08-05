interface EndOfContentIndicatorProps {
  message?: string;
  className?: string;
}

export function EndOfContentIndicator({ 
  message = "Fim dos dados", 
  className = "" 
}: EndOfContentIndicatorProps) {
  return (
    <div className={`mt-8 mb-4 flex flex-col items-center justify-center py-6 ${className}`}>
      <div className="flex items-center space-x-2 text-muted-foreground">
        <div className="h-px bg-border w-12"></div>
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse"></div>
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <div className="h-px bg-border w-12"></div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 font-medium">{message}</p>
    </div>
  );
}