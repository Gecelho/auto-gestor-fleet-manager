import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { SoundTabsTrigger } from "@/components/ui/sound-tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, MessageCircle, Loader2, Plus } from "lucide-react";
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
import { EditCarInfoDialog } from "@/components/EditCarInfoDialog";
import { WeeklyRevenueInlineView } from "@/components/WeeklyRevenueInlineView";
import { displayCurrency, displayMileage } from "@/lib/formatters";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EndOfContentIndicator } from "@/components/EndOfContentIndicator";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export default function CarDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading, error } = useCarDetails(id!);
  const { clickSound } = useSoundEffects();

  // Função para truncar texto
  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

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

  const imageUrl = car.image_url && car.image_url.includes('supabase') ? car.image_url : "https://images.unsplash.com/photo-1494976688731-30fc958eeb5e?w=800&h=400&fit=crop";

  const handleDeleteSuccess = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-modern space-y-6 page-transition">
        {/* Header */}
        <div className="card-modern mobile-p-4 p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                clickSound(); // Som ao voltar
                navigate("/");
              }}
              className="rounded-lg sm:rounded-xl h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <EditCarDialog car={car} />
              <DeleteCarDialog 
                carId={car.id} 
                carName={car.name}
                onDelete={handleDeleteSuccess}
              />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Mobile Layout */}
            <div className="sm:hidden">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="text-xl font-bold gradient-text flex-1">
                  {car.name}
                </h1>
                <Badge className={`${statusConfig[car.status].className} rounded-lg text-sm px-3 py-1.5 flex-shrink-0`}>
                  {statusConfig[car.status].label}
                </Badge>
              </div>
              <p className="text-base text-muted-foreground font-medium">{car.plate}</p>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold gradient-text mb-2">
                  {car.name}
                </h1>
                <p className="text-lg text-muted-foreground font-medium">{car.plate}</p>
              </div>
              <div className="flex-shrink-0">
                <Badge className={`${statusConfig[car.status].className} rounded-lg text-sm px-3 py-1.5`}>
                  {statusConfig[car.status].label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Layout: Image and Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Car Image */}
          <div className="lg:col-span-1">
            <div className="card-modern mobile-p-3 p-4 h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-sm mx-auto">
                  <div className="aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-inner border border-border/50 group">
                    <img 
                      src={imageUrl} 
                      alt={car.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ease-out"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1494976688731-30fc958eeb5e?w=800&h=400&fit=crop";
                      }}
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-xs text-muted-foreground font-medium">Foto do {car.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="lg:col-span-2">
            <div className="card-modern mobile-p-4 p-6 h-full flex flex-col">
              <h3 className="text-lg sm:text-xl font-bold text-card-foreground mb-4 sm:mb-6">Resumo Financeiro</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
                <div className="bg-info-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-info/20">
                  <p className="text-xs sm:text-sm text-info font-medium mb-1">Valor de Compra</p>
                  <p className="text-base sm:text-xl font-bold text-info">{displayCurrency(car.purchase_value)}</p>
                </div>
                <div className="bg-success-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-success/20">
                  <p className="text-xs sm:text-sm text-success font-medium mb-1">Total Receitas</p>
                  <p className="text-base sm:text-xl font-bold text-success">{displayCurrency(totalRevenues)}</p>
                </div>
                <div className="bg-danger-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-danger/20">
                  <p className="text-xs sm:text-sm text-danger font-medium mb-1">Total Despesas</p>
                  <p className="text-base sm:text-xl font-bold text-danger">{displayCurrency(totalExpenses)}</p>
                </div>
                <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 border ${
                  netProfit >= 0 
                    ? 'bg-info-light border-info/20' 
                    : 'bg-warning-light border-warning/20'
                }`}>
                  <p className={`text-xs sm:text-sm font-medium mb-1 ${
                    netProfit >= 0 ? 'text-info' : 'text-warning'
                  }`}>
                    {netProfit >= 0 ? 'Lucro Líquido' : 'Prejuízo'}
                  </p>
                  <p className={`text-base sm:text-xl font-bold ${
                    netProfit >= 0 ? 'text-info' : 'text-warning'
                  }`}>
                    {displayCurrency(Math.abs(netProfit))}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                <MonthlyReportDialog carId={car.id} carName={car.name} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-4 sm:space-y-6">
          <div className="card-modern mobile-p-3 p-3">
            <TabsList className="grid w-full grid-cols-4 bg-transparent gap-1 sm:gap-2 h-auto">
              <SoundTabsTrigger 
                value="info" 
                className="rounded-lg sm:rounded-xl data-[state=active]:bg-info data-[state=active]:text-info-foreground data-[state=active]:shadow-soft transition-all duration-200 text-xs sm:text-sm px-1.5 sm:px-3 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px] flex items-center justify-center font-medium"
              >
                Info
              </SoundTabsTrigger>
              <SoundTabsTrigger 
                value="expenses" 
                className="rounded-lg sm:rounded-xl data-[state=active]:bg-danger data-[state=active]:text-danger-foreground data-[state=active]:shadow-soft transition-all duration-200 text-xs sm:text-sm px-1.5 sm:px-3 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px] flex items-center justify-center font-medium"
              >
                Despesas
              </SoundTabsTrigger>
              <SoundTabsTrigger 
                value="revenues" 
                className="rounded-lg sm:rounded-xl data-[state=active]:bg-success data-[state=active]:text-success-foreground data-[state=active]:shadow-soft transition-all duration-200 text-xs sm:text-sm px-1.5 sm:px-3 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px] flex items-center justify-center font-medium"
              >
                Receitas
              </SoundTabsTrigger>
              <SoundTabsTrigger 
                value="driver" 
                className="rounded-lg sm:rounded-xl data-[state=active]:bg-warning data-[state=active]:text-warning-foreground data-[state=active]:shadow-soft transition-all duration-200 text-xs sm:text-sm px-1.5 sm:px-3 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px] flex items-center justify-center font-medium"
              >
                Motorista
              </SoundTabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="info">
            <div className="card-modern mobile-p-4 p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-card-foreground">Informações Gerais</h3>
                <EditCarInfoDialog carId={car.id} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                <div className="bg-info-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-info/20">
                  <p className="text-xs sm:text-sm text-info font-medium mb-1">Forma de Pagamento</p>
                  <p className="text-sm sm:text-base font-bold text-info">{car.payment_method || "Não informado"}</p>
                </div>
                <div className="bg-success-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-success/20">
                  <p className="text-xs sm:text-sm text-success font-medium mb-1">Data da Compra</p>
                  <p className="text-sm sm:text-base font-bold text-success">
                    {car.purchase_date ? format(parseISO(car.purchase_date), 'dd/MM/yyyy', { locale: ptBR }) : "Não informado"}
                  </p>
                </div>
                <div className="bg-info-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-info/20">
                  <p className="text-xs sm:text-sm text-info font-medium mb-1">Quilometragem</p>
                  <p className="text-sm sm:text-base font-bold text-info">
                    {car.mileage ? `${car.mileage.toLocaleString("pt-BR")} km` : "Não informado"}
                  </p>
                </div>
                <div className="bg-warning-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-warning/20">
                  <p className="text-xs sm:text-sm text-warning font-medium mb-1">Falta para Quitar</p>
                  <p className="text-sm sm:text-base font-bold text-warning">R$ {remainingBalance.toLocaleString("pt-BR")}</p>
                </div>
              </div>
              {car.notes && (
                <div className="mt-4 sm:mt-6 bg-muted rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-2">Observações</p>
                  <p className="text-sm sm:text-base font-medium text-card-foreground">{car.notes}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-border/20 transition-colors duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-xl font-bold text-card-foreground text-center sm:text-left">Despesas</h3>
                <div className="w-full sm:w-auto flex justify-center sm:justify-end">
                  <div className="w-full max-w-[200px] sm:w-auto sm:max-w-none">
                    <AddExpenseDialog carId={car.id} />
                  </div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {expenses.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-lg">Nenhuma despesa cadastrada</p>
                  </div>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense.id} className="bg-danger-light/50 border border-danger/20 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-bold text-card-foreground mb-1" title={expense.description}>
                            {truncateText(expense.description)}
                          </h4>
                          {expense.observation && (
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2" title={expense.observation}>
                              {truncateText(expense.observation, 50)}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="bg-muted px-2 py-1 rounded-md font-medium text-muted-foreground">
                              {format(parseISO(expense.date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            {expense.mileage && (
                              <span className="bg-info-light px-2 py-1 rounded-md font-medium text-info">
                                KM: {displayMileage(expense.mileage)}
                              </span>
                            )}
                            {expense.next_mileage && (
                              <span className="bg-warning-light px-2 py-1 rounded-md font-medium text-warning">
                                Próximo: {displayMileage(expense.next_mileage)} km
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end gap-2">
                          <span className="font-bold text-danger text-sm sm:text-lg">
                            {displayCurrency(expense.value)}
                          </span>
                          <div className="flex space-x-1">
                            <EditExpenseDialog expense={expense} />
                            <DeleteExpenseDialog 
                              expenseId={expense.id}
                              expenseDescription={expense.description}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="revenues">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-border/20 transition-colors duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-xl font-bold text-card-foreground text-center sm:text-left">Receitas por Semana</h3>
                <div className="w-full sm:w-auto flex justify-center sm:justify-end">
                  <div className="w-full max-w-[200px] sm:w-auto sm:max-w-none">
                    <AddRevenueDialog carId={car.id} />
                  </div>
                </div>
              </div>
              <WeeklyRevenueInlineView revenues={revenues} carId={car.id} />
            </div>
          </TabsContent>

          <TabsContent value="driver">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-border/20 transition-colors duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-xl font-bold text-card-foreground text-center sm:text-left">Dados do Motorista</h3>
                <div className="w-full sm:w-auto flex justify-center sm:justify-end">
                  <div className="w-full max-w-[200px] sm:w-auto sm:max-w-none">
                    <EditDriverDialog driver={driver} carId={car.id} />
                  </div>
                </div>
              </div>
              {driver ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                  <div className="bg-info-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-info/20">
                    <p className="text-xs text-info font-medium mb-1">Nome Completo</p>
                    <p className="text-sm sm:text-base font-bold text-info">{driver.name}</p>
                  </div>
                  <div className="bg-success-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-success/20">
                    <p className="text-xs text-success font-medium mb-1">Telefone</p>
                    <div className="space-y-2">
                      <p className="text-sm sm:text-base font-bold text-success">{driver.phone || "Não informado"}</p>
                      {driver.phone && (
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" className="rounded-lg text-xs">
                            <Phone className="w-3 h-3 mr-1" />
                            Ligar
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-success hover:bg-success/90 text-success-foreground rounded-lg text-xs"
                            onClick={() => window.open(`https://wa.me/55${driver.phone?.replace(/\D/g, '')}`)}
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            WhatsApp
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-warning-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-warning/20">
                    <p className="text-xs text-warning font-medium mb-1">CPF</p>
                    <p className="text-sm sm:text-base font-bold text-warning">{driver.cpf || "Não informado"}</p>
                  </div>
                  <div className="bg-info-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-info/20">
                    <p className="text-xs text-info font-medium mb-1">Endereço</p>
                    <p className="text-sm sm:text-base font-bold text-info">{driver.address || "Não informado"}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-lg">Nenhum motorista cadastrado</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <EndOfContentIndicator />
      </div>
    </div>
  );
}
