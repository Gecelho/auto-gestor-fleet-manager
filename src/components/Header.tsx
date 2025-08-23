
import { Car } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileDropdown } from "./ProfileDropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-xl shadow-sm">
              <Car className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">
                AutoGestor
              </h1>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                Gestão inteligente de frota
              </p>
            </div>
          </div>
          
          {/* User Info and Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle (only on desktop) */}
            {!isMobile && <ThemeToggle />}
            
            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
