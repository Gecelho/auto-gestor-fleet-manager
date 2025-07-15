
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface CarCardProps {
  id: string;
  name: string;
  plate: string;
  image: string;
  purchaseValue: number;
  totalRevenue: number;
  totalExpenses: number;
  remainingBalance: number;
  status: "quitado" | "andamento" | "alugado";
  onClick: () => void;
}

export function CarCard({
  name,
  plate,
  image,
  purchaseValue,
  totalRevenue,
  totalExpenses,
  remainingBalance,
  status,
  onClick
}: CarCardProps) {
  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit > 0;
  
  const statusConfig = {
    quitado: { label: "Quitado", className: "bg-success text-success-foreground" },
    andamento: { label: "Em Andamento", className: "bg-warning text-warning-foreground" },
    alugado: { label: "Alugado", className: "bg-info text-info-foreground" }
  };

  // Use only valid images from Supabase or placeholder
  const imageUrl = image && image.includes('supabase') ? image : "https://images.unsplash.com/photo-1494976688731-30fc958eeb5e?w=400&h=300&fit=crop";

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-card transition-all duration-300 hover:scale-[1.02] bg-gradient-card"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        {/* Car Image */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1494976688731-30fc958eeb5e?w=400&h=300&fit=crop";
            }}
          />
        </div>
        
        {/* Car Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-foreground truncate">{name}</h3>
              <p className="text-sm text-muted-foreground">{plate}</p>
            </div>
            <Badge className={statusConfig[status].className}>
              {statusConfig[status].label}
            </Badge>
          </div>
          
          {/* Purchase Value */}
          <div className="flex items-center mb-3">
            <DollarSign className="w-4 h-4 text-muted-foreground mr-1" />
            <span className="text-sm font-medium">
              R$ {purchaseValue.toLocaleString("pt-BR")}
            </span>
          </div>
          
          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center">
              <TrendingUp className="w-3 h-3 text-success mr-1" />
              <div>
                <p className="text-muted-foreground">Lucro</p>
                <p className="font-medium text-success">
                  R$ {totalRevenue.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <TrendingDown className="w-3 h-3 text-danger mr-1" />
              <div>
                <p className="text-muted-foreground">Gastos</p>
                <p className="font-medium text-danger">
                  R$ {totalExpenses.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <AlertCircle className="w-3 h-3 text-warning mr-1" />
              <div>
                <p className="text-muted-foreground">Saldo</p>
                <p className={`font-medium ${isProfit ? 'text-success' : 'text-danger'}`}>
                  R$ {Math.abs(netProfit).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
