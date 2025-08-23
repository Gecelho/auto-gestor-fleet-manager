
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarCard } from "@/components/CarCard";
import { FinancialSummary } from "@/components/FinancialSummary";
import { Header } from "@/components/Header";
import { GeneralReportDialog } from "@/components/GeneralReportDialog";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { useCars } from "@/hooks/useCars";
import { EndOfContentIndicator } from "@/components/EndOfContentIndicator";
import { LoadingSpinner, LoadingCard } from "@/components/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Search, Plus, BarChart3 } from "lucide-react";
import { AddCarDialog } from "@/components/AddCarDialog";
import { SubscriptionBlocker } from "@/components/SubscriptionBlocker";
import { SubscriptionWarning } from "@/components/SubscriptionWarning";

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
      {/* Modern Header */}
      <Header />
      
      <SubscriptionBlocker feature="basic">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
          {/* Dashboard Overview */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1 text-sm">Visão geral da sua frota</p>
              </div>
              <div className="flex justify-center sm:justify-end">
                <GeneralReportDialog />
              </div>
            </div>
            
            {/* Financial Summary - Compact Version */}
            <div className="px-1 sm:px-0">
              <FinancialSummary 
                totalRevenue={totals.totalRevenue}
                totalExpenses={totals.totalExpenses}
                totalPendingBalance={totals.totalPendingBalance}
                totalCars={cars?.length || 0}
              />
            </div>
          </div>

          {/* Cars Section */}
          <div className="space-y-6">
            {/* Cars Header with Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Seus Carros
                </h2>
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                  {filteredCars.length}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 sm:flex-none sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, placa ou status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background border-border focus:border-primary focus:ring-primary/20 h-9 text-sm"
                  />
                </div>
                
                {/* Add Car Button */}
                <AddCarDialog />
              </div>
            </div>
            
            {/* Cars Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {cars?.length === 0 ? "Nenhum carro cadastrado" : "Nenhum carro encontrado"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {cars?.length === 0 
                    ? "Comece adicionando seu primeiro carro para começar a gerenciar sua frota"
                    : "Tente ajustar os filtros de busca para encontrar o que procura"
                  }
                </p>
                {cars?.length === 0 && <AddCarDialog />}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
                
                {filteredCars.length > 0 && (
                  <div className="pt-8">
                    <EndOfContentIndicator message="Todos os carros exibidos" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Welcome Dialog for new users */}
        <WelcomeDialog />
      </SubscriptionBlocker>
      
      {/* Subscription Warning - Outside blocker so it shows even when subscription is active */}
      <SubscriptionWarning />
    </div>
  );
};

export default Index;
