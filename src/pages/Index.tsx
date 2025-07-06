import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarCard } from "@/components/CarCard";
import { FinancialSummary } from "@/components/FinancialSummary";
import { Header } from "@/components/Header";
import { useCars } from "@/hooks/useCars";


const Index = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: cars, isLoading, error } = useCars();

  // Filter cars based on search term
  const filteredCars = cars?.filter(car =>
    car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate totals
  const totals = cars?.reduce((acc, car) => ({
    totalRevenue: acc.totalRevenue + car.totalRevenue,
    totalExpenses: acc.totalExpenses + car.totalExpenses,
    totalPendingBalance: acc.totalPendingBalance + car.remainingBalance
  }), { totalRevenue: 0, totalExpenses: 0, totalPendingBalance: 0 }) || { totalRevenue: 0, totalExpenses: 0, totalPendingBalance: 0 };

  const handleCarClick = (carId: string) => {
    navigate(`/car/${carId}`);
  };


  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Erro ao carregar dados</h2>
          <p className="text-muted-foreground">Tente recarregar a página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <Header 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        <FinancialSummary 
          totalRevenue={totals.totalRevenue}
          totalExpenses={totals.totalExpenses}
          totalPendingBalance={totals.totalPendingBalance}
          totalCars={cars?.length || 0}
        />

        {/* Cars List */}
        <div className="space-y-4" style={{ backgroundColor: 'var(--cars-background)', padding: '1.5rem', borderRadius: '12px' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Seus Carros ({filteredCars.length})
            </h2>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-white">Carregando carros...</p>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white">
                {cars?.length === 0 ? "Nenhum carro cadastrado. Adicione seu primeiro carro!" : "Nenhum carro encontrado"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCars.map((car) => (
                <CarCard
                  key={car.id}
                  id={car.id}
                  name={car.name}
                  plate={car.plate}
                  image={car.image_url || "/placeholder.svg"}
                  purchaseValue={car.purchase_value}
                  totalRevenue={car.totalRevenue}
                  totalExpenses={car.totalExpenses}
                  remainingBalance={car.remainingBalance}
                  status={car.status}
                  onClick={() => handleCarClick(car.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
