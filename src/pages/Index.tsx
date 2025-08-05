
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarCard } from "@/components/CarCard";
import { FinancialSummary } from "@/components/FinancialSummary";
import { Header } from "@/components/Header";
import { GeneralReportDialog } from "@/components/GeneralReportDialog";
import { useCars } from "@/hooks/useCars";
import { EndOfContentIndicator } from "@/components/EndOfContentIndicator";


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
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Header 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        {/* Financial Summary - Mobile Optimized */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-border/20 transition-colors duration-300">
          <FinancialSummary 
            totalRevenue={totals.totalRevenue}
            totalExpenses={totals.totalExpenses}
            totalPendingBalance={totals.totalPendingBalance}
            totalCars={cars?.length || 0}
          />
          
          {/* Botão de Relatório Geral */}
          <div className="mt-4 sm:mt-6">
            <GeneralReportDialog />
          </div>
        </div>

        {/* Cars List - Mobile Optimized Grid */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-border/20 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold gradient-text">
              Seus Carros ({filteredCars.length})
            </h2>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4 text-sm sm:text-base">Carregando carros...</p>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-muted-foreground text-sm sm:text-lg px-4">
                {cars?.length === 0 ? "Nenhum carro cadastrado. Adicione seu primeiro carro!" : "Nenhum carro encontrado"}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
          
          {/* Indicador de final de página - só mostra se há carros */}
          {filteredCars.length > 0 && (
            <EndOfContentIndicator message="Todos os carros exibidos" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
