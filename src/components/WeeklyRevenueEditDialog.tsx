
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUpdateRevenue, useAddRevenue } from "@/hooks/useRevenues";
import { Loader2 } from "lucide-react";

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  totalValue: number;
  dailyValues: { [key: string]: number };
  revenues: Revenue[];
}

interface Revenue {
  id: string;
  car_id: string;
  description: string;
  value: number;
  date: string;
  type: string;
  created_at: string;
}

interface WeeklyRevenueEditDialogProps {
  week: WeekData;
  carId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function WeeklyRevenueEditDialog({ week, carId, open, onOpenChange }: WeeklyRevenueEditDialogProps) {
  const [dailyValues, setDailyValues] = useState<{ [key: string]: string }>(() => {
    const values: { [key: string]: string } = {};
    for (let i = 0; i < 7; i++) {
      const day = addDays(week.weekStart, i);
      const dayKey = format(day, 'yyyy-MM-dd');
      values[dayKey] = (week.dailyValues[dayKey] || 0).toString();
    }
    return values;
  });

  const updateRevenueMutation = useUpdateRevenue();
  const addRevenueMutation = useAddRevenue();

  // Preparar dados para o gráfico
  const chartData = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(week.weekStart, i);
    const dayKey = format(day, 'yyyy-MM-dd');
    chartData.push({
      day: dayNames[i],
      value: parseFloat(dailyValues[dayKey]) || 0,
      fullDate: format(day, 'dd/MM', { locale: ptBR }),
      dayNumber: format(day, 'dd')
    });
  }

  const handleDailyValueChange = (dayKey: string, value: string) => {
    setDailyValues(prev => ({
      ...prev,
      [dayKey]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Para cada dia da semana, verificar se precisa atualizar ou criar receita
      for (let i = 0; i < 7; i++) {
        const day = addDays(week.weekStart, i);
        const dayKey = format(day, 'yyyy-MM-dd');
        const newValue = parseFloat(dailyValues[dayKey]) || 0;
        const existingValue = week.dailyValues[dayKey] || 0;

        if (newValue !== existingValue) {
          // Encontrar receitas existentes para este dia
          const dayRevenues = week.revenues.filter(r => r.date === dayKey);
          
          if (dayRevenues.length > 0) {
            // Atualizar a primeira receita do dia
            const revenue = dayRevenues[0];
            await updateRevenueMutation.mutateAsync({
              id: revenue.id,
              description: revenue.description,
              value: newValue,
              date: dayKey,
              type: revenue.type
            });
          } else if (newValue > 0) {
            // Criar nova receita para este dia
            await addRevenueMutation.mutateAsync({
              car_id: carId,
              description: `Receita ${format(day, 'dd/MM', { locale: ptBR })}`,
              value: newValue,
              date: dayKey,
              type: 'outros'
            });
          }
        }
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving weekly revenue:', error);
    }
  };

  const isLoading = updateRevenueMutation.isPending || addRevenueMutation.isPending;
  const totalWeekValue = chartData.reduce((sum, data) => sum + data.value, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center text-xl">
            {format(week.weekStart, 'dd', { locale: ptBR })} de {format(week.weekStart, 'MMM', { locale: ptBR })}. - {format(week.weekEnd, 'dd', { locale: ptBR })} de {format(week.weekEnd, 'MMM', { locale: ptBR })}.
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Valor total da semana */}
          <div className="text-center flex-shrink-0">
            <h2 className="text-2xl font-bold">
              R$ {totalWeekValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </h2>
          </div>

          {/* Container principal com duas colunas */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
            {/* Coluna esquerda - Gráfico */}
            <div className="flex flex-col">
              <div className="flex-1 min-h-0">
                <ChartContainer
                  config={{
                    value: {
                      label: "Receita",
                      color: "#3B82F6",
                    },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                      <XAxis 
                        dataKey="day" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#666' }}
                      />
                      <YAxis hide />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => [
                              `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                              "Receita"
                            ]}
                          />
                        }
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#3B82F6" 
                        radius={[3, 3, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              {/* Labels com números dos dias - abaixo do gráfico */}
              <div className="flex justify-center mt-2 space-x-6 flex-shrink-0">
                {chartData.map((data, index) => (
                  <div key={index} className="text-center">
                    <div className="text-sm font-semibold">{data.dayNumber}</div>
                    <div className="text-xs text-muted-foreground">{data.day}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna direita - Inputs */}
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-center mb-4 flex-shrink-0">Editar valores por dia</h3>
              
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {chartData.map((dayData, index) => {
                    const day = addDays(week.weekStart, index);
                    const dayKey = format(day, 'yyyy-MM-dd');
                    
                    return (
                      <div key={dayKey} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-16 text-center">
                          <div className="text-sm font-medium">{dayData.day}</div>
                          <div className="text-xs text-muted-foreground">{dayData.dayNumber}</div>
                        </div>
                        <div className="flex-1">
                          <Label className="sr-only">
                            Valor para {dayData.day}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={dailyValues[dayKey]}
                            onChange={(e) => handleDailyValueChange(dayKey, e.target.value)}
                            placeholder="0.00"
                            className="text-center h-10 relative z-20"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Botões - sempre visíveis no final */}
          <div className="flex justify-end space-x-2 pt-4 border-t flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
