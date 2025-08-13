
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarCard } from "@/components/CarCard";
import { FinancialSummary } from "@/components/FinancialSummary";
import { Header } from "@/components/Header";
import { GeneralReportDialog } from "@/components/GeneralReportDialog";
import { useCars } from "@/hooks/useCars";
import { EndOfContentIndicator } from "@/components/EndOfContentIndicator";
import { LoadingSpinner, LoadingCard } from "@/components/LoadingSpinner";


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
      <div className="container-modern space-y-6 page-transition">
        <Header 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        {/* Financial Summary */}
        <div className="card-modern p-6">
          <FinancialSummary 
            totalRevenue={totals.totalRevenue}
            totalExpenses={totals.totalExpenses}
            totalPendingBalance={totals.totalPendingBalance}
            totalCars={cars?.length || 0}
          />
          
          <div className="mt-6 pt-6 border-t border-border">
            <GeneralReportDialog />
          </div>
        </div>

        {/* Cars List */}
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text">
              Seus Carros ({filteredCars.length})
            </h2>
          </div>
          
          {isLoading ? (
            <div className="grid-responsive">
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-muted-foreground text-lg px-4">
                {cars?.length === 0 ? "Nenhum carro cadastrado. Adicione seu primeiro carro!" : "Nenhum carro encontrado"}
              </p>
            </div>
          ) : (
            <div className="grid-responsive">
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
                  mileage={car.mileage || 0}
                  onClick={() => handleCarClick(car.id)}
                />
              ))}
            </div>
          )}
          
          {filteredCars.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <EndOfContentIndicator message="Todos os carros exibidos" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
