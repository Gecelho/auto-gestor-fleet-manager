import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Car } from "lucide-react";
import { AddCarDialog } from "./AddCarDialog";

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function Header({ searchTerm, onSearchChange }: HeaderProps) {
  return (
    <div className="mb-8">
      {/* App Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-primary rounded-xl">
            <Car className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">AutoGestor</h1>
            <p className="text-muted-foreground">Gerencie sua frota com estilo</p>
          </div>
        </div>
        
        <AddCarDialog />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, placa ou status..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}