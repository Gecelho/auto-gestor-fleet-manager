import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Trash2, Phone, MessageCircle } from "lucide-react";

// Mock data - in a real app this would come from props or API
const mockCarData = {
  id: "1",
  name: "Onix LT 2022",
  plate: "ABC-1234",
  image: "/src/assets/car-1.jpg",
  purchaseValue: 45000,
  paymentMethod: "Financiado",
  purchaseDate: "2023-01-15",
  mileage: 25000,
  notes: "Carro em excelente estado",
  status: "alugado" as const,
  expenses: [
    { id: "1", description: "Troca de óleo", value: 150, date: "2024-01-10", category: "manutenção" },
    { id: "2", description: "IPVA 2024", value: 890, date: "2024-02-01", category: "documentos" },
    { id: "3", description: "Seguro anual", value: 1200, date: "2024-01-05", category: "seguro" }
  ],
  revenues: [
    { id: "1", description: "Aluguel Janeiro", value: 1500, date: "2024-01-31", type: "aluguel" },
    { id: "2", description: "Aluguel Fevereiro", value: 1500, date: "2024-02-29", type: "aluguel" }
  ],
  driver: {
    name: "João Silva",
    phone: "(11) 99999-9999",
    cpf: "123.456.789-00",
    address: "Rua das Flores, 123 - São Paulo/SP"
  }
};

export default function CarDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [car] = useState(mockCarData);

  const totalExpenses = car.expenses.reduce((sum, expense) => sum + expense.value, 0);
  const totalRevenues = car.revenues.reduce((sum, revenue) => sum + revenue.value, 0);
  const netProfit = totalRevenues - totalExpenses;
  const remainingBalance = car.purchaseValue - netProfit;

  const statusConfig = {
    quitado: { label: "Quitado", className: "bg-success text-success-foreground" },
    andamento: { label: "Em Andamento", className: "bg-warning text-warning-foreground" },
    alugado: { label: "Alugado", className: "bg-info text-info-foreground" }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-bold">{car.name}</h1>
                <Badge className={statusConfig[car.status].className}>
                  {statusConfig[car.status].label}
                </Badge>
              </div>
              <p className="text-muted-foreground">{car.plate}</p>
            </div>
          </div>
        </div>

        {/* Car Image */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-64 bg-muted">
            <img 
              src={car.image} 
              alt={car.name}
              className="w-full h-full object-cover"
            />
          </div>
        </Card>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Valor de Compra</p>
            <p className="text-xl font-bold">R$ {car.purchaseValue.toLocaleString("pt-BR")}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Receitas</p>
            <p className="text-xl font-bold text-success">R$ {totalRevenues.toLocaleString("pt-BR")}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Despesas</p>
            <p className="text-xl font-bold text-danger">R$ {totalExpenses.toLocaleString("pt-BR")}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Lucro Líquido</p>
            <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              R$ {Math.abs(netProfit).toLocaleString("pt-BR")}
            </p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="revenues">Receitas</TabsTrigger>
            <TabsTrigger value="driver">Motorista</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informações Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                  <p className="font-medium">{car.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data da Compra</p>
                  <p className="font-medium">{new Date(car.purchaseDate).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quilometragem</p>
                  <p className="font-medium">{car.mileage.toLocaleString("pt-BR")} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Falta para Quitar</p>
                  <p className="font-medium text-warning">R$ {remainingBalance.toLocaleString("pt-BR")}</p>
                </div>
              </div>
              {car.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="font-medium">{car.notes}</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Despesas</h3>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Despesa
                </Button>
              </div>
              <div className="space-y-3">
                {car.expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString("pt-BR")} • {expense.category}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-danger">
                        R$ {expense.value.toLocaleString("pt-BR")}
                      </span>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="revenues">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Receitas</h3>
                <Button variant="success">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Receita
                </Button>
              </div>
              <div className="space-y-3">
                {car.revenues.map((revenue) => (
                  <div key={revenue.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{revenue.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(revenue.date).toLocaleDateString("pt-BR")} • {revenue.type}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-success">
                        R$ {revenue.value.toLocaleString("pt-BR")}
                      </span>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="driver">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Dados do Motorista</h3>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome Completo</p>
                  <p className="font-medium">{car.driver.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{car.driver.phone}</p>
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4 mr-2" />
                      Ligar
                    </Button>
                    <Button variant="success" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium">{car.driver.cpf}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">{car.driver.address}</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}