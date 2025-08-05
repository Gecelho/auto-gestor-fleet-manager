
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
    <div className="bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-border/20 transition-colors duration-300">
      {/* Mobile-First Header Layout */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Top Row: Title + Add Button */}
        <div className="flex items-center justify-between">
          {/* App Title - Mobile Optimized */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-2 sm:p-2.5 bg-primary rounded-lg sm:rounded-xl shadow-lg transition-colors duration-300">
              <Car className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold gradient-text">
                AutoGestor
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gerencie sua frota com estilo</p>
            </div>
          </div>

          {/* Action Buttons - Always visible */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <AddCarDialog />
            <SettingsDialog />
          </div>
        </div>

        {/* Search Row - Full Width on Mobile */}
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar carros..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 bg-background/50 border-border focus:border-primary focus:ring-primary/20 rounded-lg sm:rounded-xl transition-colors duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
