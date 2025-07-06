import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarCard } from "@/components/CarCard";
import { FinancialSummary } from "@/components/FinancialSummary";
import { Header } from "@/components/Header";
import car1Image from "@/assets/car-1.jpg";
import car2Image from "@/assets/car-2.jpg";
import car3Image from "@/assets/car-3.jpg";

// Mock data - in a real app this would come from API/database
const mockCars = [
  {
    id: "1",
    name: "Onix LT 2022",
    plate: "ABC-1234",
    image: car1Image,
    purchaseValue: 45000,
    totalRevenue: 3000,
    totalExpenses: 2240,
    remainingBalance: 44240,
    status: "alugado" as const
  },
  {
    id: "2", 
    name: "HB20 Comfort 2021",
    plate: "DEF-5678",
    image: car2Image,
    purchaseValue: 38000,
    totalRevenue: 4500,
    totalExpenses: 1800,
    remainingBalance: 35300,
    status: "andamento" as const
  },
  {
    id: "3",
    name: "Fiesta SE 2020", 
    plate: "GHI-9012",
    image: car3Image,
    purchaseValue: 35000,
    totalRevenue: 8000,
    totalExpenses: 3200,
    remainingBalance: 30200,
    status: "quitado" as const
  }
];

const Index = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [cars] = useState(mockCars);

  // Filter cars based on search term
  const filteredCars = cars.filter(car =>
    car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totals = cars.reduce((acc, car) => ({
    totalRevenue: acc.totalRevenue + car.totalRevenue,
    totalExpenses: acc.totalExpenses + car.totalExpenses,
    totalPendingBalance: acc.totalPendingBalance + car.remainingBalance
  }), { totalRevenue: 0, totalExpenses: 0, totalPendingBalance: 0 });

  const handleCarClick = (carId: string) => {
    navigate(`/car/${carId}`);
  };

  const handleAddCar = () => {
    // In a real app, this would open a modal or navigate to add car page
    console.log("Add new car");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <Header 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddCar={handleAddCar}
        />
        
        <FinancialSummary 
          totalRevenue={totals.totalRevenue}
          totalExpenses={totals.totalExpenses}
          totalPendingBalance={totals.totalPendingBalance}
          totalCars={cars.length}
        />

        {/* Cars List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Seus Carros ({filteredCars.length})
            </h2>
          </div>
          
          {filteredCars.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum carro encontrado</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCars.map((car) => (
                <CarCard
                  key={car.id}
                  id={car.id}
                  name={car.name}
                  plate={car.plate}
                  image={car.image}
                  purchaseValue={car.purchaseValue}
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
