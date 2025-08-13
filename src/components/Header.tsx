
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Car } from "lucide-react";
import { AddCarDialog } from "./AddCarDialog";
import { SettingsDialog } from "./SettingsDialog";

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function Header({ searchTerm, onSearchChange }: HeaderProps) {
  return (
    <div className="card-modern mobile-p-4 p-6">
      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center">
        {/* App Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-primary rounded-lg sm:rounded-xl shadow-soft">
              <Car className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold gradient-text">
                AutoGestor
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gerencie sua frota com estilo</p>
            </div>
          </div>
          
          {/* Mobile Actions - Only on small screens */}
          <div className="flex items-center gap-2 sm:hidden">
            <AddCarDialog />
            <SettingsDialog />
          </div>
        </div>

        {/* Search and Desktop Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 lg:ml-auto lg:flex-1 lg:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar carros..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-background border-border focus:border-primary focus:ring-primary/20 h-10 sm:h-auto"
            />
          </div>
          
          {/* Desktop Actions - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-3">
            <AddCarDialog />
            <SettingsDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
