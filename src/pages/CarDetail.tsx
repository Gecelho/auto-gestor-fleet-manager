import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { SoundTabsTrigger } from "@/components/ui/sound-tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, MessageCircle, Loader2, Plus, TrendingUp, TrendingDown, Car, Settings, BarChart3, Calendar, User, Wrench, Trash2, Upload } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DollarSign } from "lucide-react";
import { useCarDetails } from "@/hooks/useCarDetails";
import { useUpdateCar } from "@/hooks/useCars";
import { useImageUpload } from "@/hooks/useImageUpload";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { AddRevenueDialog } from "@/components/AddRevenueDialog";
import { MonthlyReportDialog } from "@/components/MonthlyReportDialog";
import { EditCarDialog } from "@/components/EditCarDialog";
import { DeleteCarDialog } from "@/components/DeleteCarDialog";
import { EditCarDialogCustom } from "@/components/EditCarDialogCustom";
import { DeleteCarDialogCustom } from "@/components/DeleteCarDialogCustom";
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
import { SubscriptionBlocker } from "@/components/SubscriptionBlocker";
import { CarIcon } from "@/components/CarIcon";
import { useRef } from "react";

export default function CarDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading, error, refetch } = useCarDetails(id!);
  const { clickSound } = useSoundEffects();
  const updateCar = useUpdateCar();
  const { uploadImage, uploading } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para truncar texto
  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="md" />
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

  const hasValidImage = car.image_url && car.image_url.includes('supabase');

  const handleDeleteSuccess = () => {
    navigate("/");
  };

  const handleImageUpload = async (file: File) => {
    if (!file || !car) return;

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      await updateCar.mutateAsync({
        id: car.id,
        image_url: imageUrl
      });
      // Refetch para atualizar a página com a nova imagem
      refetch();
    }
  };

  const handlePlaceholderClick = () => {
    if (!hasValidImage && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  return (
    <SubscriptionBlocker feature="basic">
      <div className="min-h-screen bg-background">
        {/* Clean Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back button and car info */}
            <div className="flex items-center space-x-1 sm:space-x-3 flex-1 min-w-0">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  clickSound();
                  navigate("/");
                }}
                className="rounded-xl h-7 w-7 sm:h-10 sm:w-10 flex-shrink-0 p-1"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              
              <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 shadow-sm flex items-center justify-center">
                  {hasValidImage ? (
                    <img 
                      src={car.image_url} 
                      alt={car.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <CarIcon 
                      size={20} 
                      className="text-gray-400 dark:text-gray-500" 
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg font-bold gradient-text truncate">
                    {car.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {car.plate}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right side - Action buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Edit Button - Responsive */}
              <EditCarDialogCustom 
                car={car}
                trigger={
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-xl h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-4"
                  >
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                }
              />
              
              {/* Delete Button - Responsive */}
              <DeleteCarDialogCustom 
                carId={car.id} 
                carName={car.name}
                onDelete={handleDeleteSuccess}
                trigger={
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-xl h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-4 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Excluir</span>
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">

        {/* Car Image */}
        <div className="bg-background border border-border rounded-xl p-6">
          <div className="rounded-xl overflow-hidden bg-muted h-32 sm:h-48 md:h-64 lg:h-80 relative">
            {hasValidImage ? (
              <img 
                src={car.image_url} 
                alt={car.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div 
                onClick={handlePlaceholderClick}
                className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 cursor-pointer hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-300 group"
              >
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400 dark:text-gray-500 animate-spin mb-4" />
                    <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">
                      Enviando foto...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:shadow-xl transition-shadow duration-300">
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors duration-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        Clique para adicionar foto
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                        Selecione uma imagem do veículo
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <p className="text-sm font-light text-muted-foreground text-center mt-3">Foto do Veículo</p>
          
          {/* Input de arquivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium opacity-80">Valor de Compra</p>
                <p className="text-lg font-bold">{displayCurrency(car.purchase_value)}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Car className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium opacity-80">Total Receitas</p>
                <p className="text-lg font-bold">{displayCurrency(totalRevenues)}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium opacity-80">Total Despesas</p>
                <p className="text-lg font-bold">{displayCurrency(totalExpenses)}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
            netProfit >= 0 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium opacity-80">
                  {netProfit >= 0 ? 'Lucro Líquido' : 'Prejuízo'}
                </p>
                <p className="text-lg font-bold">{displayCurrency(Math.abs(netProfit))}</p>
              </div>
              <div className={`p-2 rounded-lg ${
                netProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-orange-100 dark:bg-orange-900'
              }`}>
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Report Button */}
        <div className="flex justify-center">
          <MonthlyReportDialog carId={car.id} carName={car.name} />
        </div>

        {/* Modern Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <div className="bg-background border border-border rounded-xl p-1 mx-0">
            <TabsList className="grid w-full grid-cols-4 bg-transparent gap-1 h-auto">
              <SoundTabsTrigger 
                value="info" 
                className="rounded-lg data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:dark:bg-blue-900 data-[state=active]:dark:text-blue-300 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4 py-2.5 font-medium flex items-center justify-center gap-1 sm:gap-2"
              >
                <Settings className="w-4 h-4 flex-shrink-0 hidden sm:block" />
                <span className="sm:hidden">Info</span>
                <span className="hidden sm:inline">Informações</span>
              </SoundTabsTrigger>
              <SoundTabsTrigger 
                value="expenses" 
                className="rounded-lg data-[state=active]:bg-red-100 data-[state=active]:text-red-700 data-[state=active]:dark:bg-red-900 data-[state=active]:dark:text-red-300 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4 py-2.5 font-medium flex items-center justify-center gap-1 sm:gap-2"
              >
                <Wrench className="w-4 h-4 flex-shrink-0 hidden sm:block" />
                <span>Despesas</span>
              </SoundTabsTrigger>
              <SoundTabsTrigger 
                value="revenues" 
                className="rounded-lg data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=active]:dark:bg-green-900 data-[state=active]:dark:text-green-300 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4 py-2.5 font-medium flex items-center justify-center gap-1 sm:gap-2"
              >
                <BarChart3 className="w-4 h-4 flex-shrink-0 hidden sm:block" />
                <span>Receitas</span>
              </SoundTabsTrigger>
              <SoundTabsTrigger 
                value="driver" 
                className="rounded-lg data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700 data-[state=active]:dark:bg-yellow-900 data-[state=active]:dark:text-yellow-300 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4 py-2.5 font-medium flex items-center justify-center gap-1 sm:gap-2"
              >
                <User className="w-4 h-4 flex-shrink-0 hidden sm:block" />
                <span>Motorista</span>
              </SoundTabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="info">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Informações Gerais</h3>
                <EditCarInfoDialog carId={car.id} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Forma de Pagamento</p>
                  <p className="text-base font-semibold text-blue-700 dark:text-blue-300">{car.payment_method || "Não informado"}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Data da Compra</p>
                  <p className="text-base font-semibold text-green-700 dark:text-green-300">
                    {car.purchase_date ? format(parseISO(car.purchase_date), 'dd/MM/yyyy', { locale: ptBR }) : "Não informado"}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Quilometragem</p>
                  <p className="text-base font-semibold text-purple-700 dark:text-purple-300">
                    {car.mileage ? `${car.mileage.toLocaleString("pt-BR")} km` : "Não informado"}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Falta para Quitar</p>
                  <p className="text-base font-semibold text-orange-700 dark:text-orange-300">R$ {remainingBalance.toLocaleString("pt-BR")}</p>
                </div>
                <div className={`rounded-lg p-4 border ${
                  car.status === 'quitado' ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 
                  car.status === 'andamento' ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' : 
                  'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                }`}>
                  <p className={`text-sm font-medium mb-1 ${
                    car.status === 'quitado' ? 'text-green-600 dark:text-green-400' : 
                    car.status === 'andamento' ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-blue-600 dark:text-blue-400'
                  }`}>Status</p>
                  <p className={`text-base font-semibold ${
                    car.status === 'quitado' ? 'text-green-700 dark:text-green-300' : 
                    car.status === 'andamento' ? 'text-yellow-700 dark:text-yellow-300' : 
                    'text-blue-700 dark:text-blue-300'
                  }`}>{statusConfig[car.status].label}</p>
                </div>
              </div>

              {car.notes && (
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Observações</p>
                  <p className="text-base text-foreground">{car.notes}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="space-y-3">
              {/* Header responsivo */}
              <div className="text-center sm:text-left mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-0">Despesas</h3>
                  <div className="sm:hidden">
                    <AddExpenseDialog carId={car.id} />
                  </div>
                  <div className="hidden sm:block">
                    <AddExpenseDialog carId={car.id} />
                  </div>
                </div>
              </div>
              
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Wrench className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma despesa cadastrada</h3>
                  <p className="text-muted-foreground mb-6">Comece adicionando sua primeira despesa</p>
                  <AddExpenseDialog carId={car.id} />
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl p-3 hover:shadow-lg transition-all duration-200">
                      {/* Layout Mobile */}
                      <div className="sm:hidden">
                        {/* Título principal */}
                        <div className="mb-1">
                          <h4 className="font-bold text-foreground text-sm leading-tight" title={expense.description}>
                            {expense.description.length > 25 
                              ? expense.description.substring(0, 25) + "..." 
                              : expense.description
                            }
                          </h4>
                        </div>
                        
                        {/* Observação/Descrição detalhada */}
                        {expense.observation && (
                          <div className="mb-1.5">
                            <p className="text-muted-foreground text-xs leading-snug">
                              {expense.observation.length > 50 
                                ? expense.observation.substring(0, 50) + "..." 
                                : expense.observation
                              }
                            </p>
                          </div>
                        )}
                        
                        {/* Data e KM lado a lado */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="bg-gray-600 text-gray-100 px-1.5 py-0.5 rounded text-xs font-medium">
                            {format(parseISO(expense.date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          {expense.mileage && (
                            <span className="bg-blue-600 text-blue-100 px-1.5 py-0.5 rounded text-xs font-medium">
                              KM: {displayMileage(expense.mileage)}
                            </span>
                          )}
                        </div>
                        
                        {/* Próximo KM (se houver) */}
                        {expense.next_mileage && (
                          <div className="mb-1.5">
                            <span className="bg-yellow-600 text-yellow-100 px-1.5 py-0.5 rounded text-xs font-medium">
                              Próximo: {displayMileage(expense.next_mileage)} km
                            </span>
                          </div>
                        )}
                        
                        {/* Valor e botões de ação */}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-600 dark:text-red-400 text-base">
                            {displayCurrency(expense.value)}
                          </span>
                          <div className="flex gap-1">
                            <EditExpenseDialog expense={expense} />
                            <DeleteExpenseDialog 
                              expenseId={expense.id}
                              expenseDescription={expense.description}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Layout Desktop */}
                      <div className="hidden sm:block">
                        <div className="flex items-start justify-between">
                          {/* Lado esquerdo - Informações */}
                          <div className="flex-1 min-w-0">
                            {/* Título */}
                            <div className="mb-1">
                              <h4 className="font-bold text-foreground text-sm leading-tight" title={expense.description}>
                                {expense.description}
                              </h4>
                            </div>
                            
                            {/* Observação */}
                            {expense.observation && (
                              <div className="mb-1.5">
                                <p className="text-muted-foreground text-xs leading-snug">
                                  {expense.observation}
                                </p>
                              </div>
                            )}
                            
                            {/* Data e KM */}
                            <div className="flex items-center gap-1.5">
                              <span className="bg-gray-600 text-gray-100 px-1.5 py-0.5 rounded text-xs font-medium">
                                {format(parseISO(expense.date), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              {expense.mileage && (
                                <span className="bg-blue-600 text-blue-100 px-1.5 py-0.5 rounded text-xs font-medium">
                                  KM: {displayMileage(expense.mileage)}
                                </span>
                              )}
                              {expense.next_mileage && (
                                <span className="bg-yellow-600 text-yellow-100 px-1.5 py-0.5 rounded text-xs font-medium">
                                  Próximo: {displayMileage(expense.next_mileage)} km
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Lado direito - Valor e botões */}
                          <div className="flex items-center gap-3 ml-4">
                            <span className="font-bold text-red-600 dark:text-red-400 text-base">
                              {displayCurrency(expense.value)}
                            </span>
                            <div className="flex gap-1">
                              <EditExpenseDialog expense={expense} />
                              <DeleteExpenseDialog 
                                expenseId={expense.id}
                                expenseDescription={expense.description}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="revenues">
            <div>
              {/* Header responsivo */}
              <div className="text-center sm:text-left mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-0">Receitas por Semana</h3>
                  <div className="sm:hidden">
                    <AddRevenueDialog carId={car.id} />
                  </div>
                  <div className="hidden sm:block">
                    <AddRevenueDialog carId={car.id} />
                  </div>
                </div>
              </div>
              <WeeklyRevenueInlineView revenues={revenues} carId={car.id} />
            </div>
          </TabsContent>

          <TabsContent value="driver">
            <div>
              {/* Header responsivo */}
              <div className="text-center sm:text-left mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-0">Dados do Motorista</h3>
                  <div className="sm:hidden">
                    <EditDriverDialog driver={driver} carId={car.id} />
                  </div>
                  <div className="hidden sm:block">
                    <EditDriverDialog driver={driver} carId={car.id} />
                  </div>
                </div>
              </div>
              
              {driver ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Nome Completo</p>
                    <p className="text-base font-semibold text-blue-700 dark:text-blue-300">{driver.name}</p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Telefone</p>
                    <div className="space-y-3">
                      <p className="text-base font-semibold text-green-700 dark:text-green-300">
                        {driver.phone || "Não informado"}
                      </p>
                      {driver.phone && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-lg text-xs"
                            onClick={() => window.open(`tel:${driver.phone}`)}
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            Ligar
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs"
                            onClick={() => window.open(`https://wa.me/55${driver.phone?.replace(/\D/g, '')}`)}
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            WhatsApp
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">CPF</p>
                    <p className="text-base font-semibold text-yellow-700 dark:text-yellow-300">
                      {driver.cpf || "Não informado"}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">Endereço</p>
                    <p className="text-base font-semibold text-purple-700 dark:text-purple-300">
                      {driver.address || "Não informado"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum motorista cadastrado</h3>
                  <p className="text-muted-foreground mb-6">Adicione as informações do motorista</p>
                  <EditDriverDialog driver={driver} carId={car.id} />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <EndOfContentIndicator />
      </div>
      </div>
    </SubscriptionBlocker>
  );
}
