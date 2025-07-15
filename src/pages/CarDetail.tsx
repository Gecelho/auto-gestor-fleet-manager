import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, MessageCircle, Loader2 } from "lucide-react";
import { useCarDetails } from "@/hooks/useCarDetails";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { AddRevenueDialog } from "@/components/AddRevenueDialog";
import { MonthlyReportDialog } from "@/components/MonthlyReportDialog";
import { EditCarDialog } from "@/components/EditCarDialog";
import { DeleteCarDialog } from "@/components/DeleteCarDialog";
import { EditExpenseDialog } from "@/components/EditExpenseDialog";
import { DeleteExpenseDialog } from "@/components/DeleteExpenseDialog";
import { EditRevenueDialog } from "@/components/EditRevenueDialog";
import { DeleteRevenueDialog } from "@/components/DeleteRevenueDialog";
import { EditDriverDialog } from "@/components/EditDriverDialog";

export default function CarDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading, error } = useCarDetails(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Carro não encontrado</h2>
          <Button onClick={() => navigate("/")}>Voltar para lista</Button>
        </div>
      </div>
    );
  }

  const { car, expenses, revenues, driver } = data;

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.value), 0);
  const totalRevenues = revenues.reduce((sum, revenue) => sum + Number(revenue.value), 0);
  const netProfit = totalRevenues - totalExpenses;
  const remainingBalance = Number(car.purchase_value) - netProfit;

  const statusConfig = {
    quitado: { label: "Quitado", className: "bg-success text-success-foreground" },
    andamento: { label: "Em Andamento", className: "bg-warning text-warning-foreground" },
    alugado: { label: "Alugado", className: "bg-info text-info-foreground" }
  };

  // Use only valid images from Supabase or placeholder
  const imageUrl = car.image_url && car.image_url.includes('supabase') ? car.image_url : "https://images.unsplash.com/photo-1494976688731-30fc958eeb5e?w=800&h=400&fit=crop";

  const handleDeleteSuccess = () => {
    navigate("/");
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
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <EditCarDialog car={car} />
            <DeleteCarDialog 
              carId={car.id} 
              carName={car.name}
              onDelete={handleDeleteSuccess}
            />
          </div>
        </div>

        {/* Car Image */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-64 bg-muted">
            <img 
              src={imageUrl} 
              alt={car.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://images.unsplash.com/photo-1494976688731-30fc958eeb5e?w=800&h=400&fit=crop";
              }}
            />
          </div>
        </Card>

        {/* Financial Summary Cards with improved background */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4" style={{ background: 'linear-gradient(135deg, rgba(50,204,254,0.1) 0%, rgba(50,204,254,0.05) 100%)' }}>
            <p className="text-sm text-muted-foreground">Valor de Compra</p>
            <p className="text-xl font-bold">R$ {Number(car.purchase_value).toLocaleString("pt-BR")}</p>
          </Card>
          <Card className="p-4" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)' }}>
            <p className="text-sm text-muted-foreground">Total Receitas</p>
            <p className="text-xl font-bold text-success">R$ {totalRevenues.toLocaleString("pt-BR")}</p>
          </Card>
          <Card className="p-4" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%)' }}>
            <p className="text-sm text-muted-foreground">Total Despesas</p>
            <p className="text-xl font-bold text-danger">R$ {totalExpenses.toLocaleString("pt-BR")}</p>
          </Card>
          <Card className="p-4" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(168,85,247,0.05) 100%)' }}>
            <p className="text-sm text-muted-foreground">Lucro Líquido</p>
            <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              R$ {Math.abs(netProfit).toLocaleString("pt-BR")}
            </p>
          </Card>
        </div>

        {/* Monthly Report Button */}
        <div className="mb-6">
          <MonthlyReportDialog carId={car.id} />
        </div>

        {/* Tabs with improved styling */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4" style={{ background: 'rgba(50,204,254,0.1)' }}>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="revenues">Receitas</TabsTrigger>
            <TabsTrigger value="driver">Motorista</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card className="p-6" style={{ background: 'linear-gradient(135deg, rgba(50,204,254,0.05) 0%, rgba(255,255,255,1) 100%)' }}>
              <h3 className="text-lg font-semibold mb-4">Informações Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                  <p className="font-medium">{car.payment_method || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data da Compra</p>
                  <p className="font-medium">
                    {car.purchase_date ? new Date(car.purchase_date).toLocaleDateString("pt-BR") : "Não informado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quilometragem</p>
                  <p className="font-medium">
                    {car.mileage ? `${car.mileage.toLocaleString("pt-BR")} km` : "Não informado"}
                  </p>
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
            <Card className="p-6" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(255,255,255,1) 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Despesas</h3>
                <AddExpenseDialog carId={car.id} />
              </div>
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma despesa cadastrada</p>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString("pt-BR")} • {expense.category}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-danger">
                          R$ {Number(expense.value).toLocaleString("pt-BR")}
                        </span>
                        <EditExpenseDialog expense={expense} />
                        <DeleteExpenseDialog 
                          expenseId={expense.id}
                          expenseDescription={expense.description}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="revenues">
            <Card className="p-6" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(255,255,255,1) 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Receitas</h3>
                <AddRevenueDialog carId={car.id} />
              </div>
              <div className="space-y-3">
                {revenues.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma receita cadastrada</p>
                ) : (
                  revenues.map((revenue) => (
                    <div key={revenue.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{revenue.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(revenue.date).toLocaleDateString("pt-BR")} • {revenue.type}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-success">
                          R$ {Number(revenue.value).toLocaleString("pt-BR")}
                        </span>
                        <EditRevenueDialog revenue={revenue} />
                        <DeleteRevenueDialog 
                          revenueId={revenue.id}
                          revenueDescription={revenue.description}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="driver">
            <Card className="p-6" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.05) 0%, rgba(255,255,255,1) 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Dados do Motorista</h3>
                <EditDriverDialog driver={driver} carId={car.id} />
              </div>
              {driver ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome Completo</p>
                    <p className="font-medium">{driver.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{driver.phone || "Não informado"}</p>
                      {driver.phone && (
                        <>
                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4 mr-2" />
                            Ligar
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => window.open(`https://wa.me/55${driver.phone?.replace(/\D/g, '')}`)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{driver.cpf || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">{driver.address || "Não informado"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum motorista cadastrado</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
