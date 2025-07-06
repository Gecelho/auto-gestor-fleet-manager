import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Car } from "lucide-react";

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddCar: () => void;
}

export function Header({ searchTerm, onSearchChange, onAddCar }: HeaderProps) {
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
        
        <Button 
          onClick={onAddCar}
          className="bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Carro
        </Button>
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