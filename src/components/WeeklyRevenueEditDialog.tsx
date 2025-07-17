
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
      fullDate: format(day, 'dd/MM', { locale: ptBR })
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar Receitas da Semana - {format(week.weekStart, 'dd/MM', { locale: ptBR })} a {format(week.weekEnd, 'dd/MM/yyyy', { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Gráfico */}
          <div className="h-64">
            <h3 className="text-lg font-semibold mb-4">Receitas por Dia da Semana</h3>
            <ChartContainer
              config={{
                value: {
                  label: "Receita",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="day" />
                  <YAxis />
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
                  <Bar dataKey="value" fill="var(--color-value)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Inputs para cada dia */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chartData.map((dayData, index) => {
              const day = addDays(week.weekStart, index);
              const dayKey = format(day, 'yyyy-MM-dd');
              
              return (
                <div key={dayKey} className="space-y-2">
                  <Label>
                    {dayData.day} ({dayData.fullDate})
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={dailyValues[dayKey]}
                    onChange={(e) => handleDailyValueChange(dayKey, e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              );
            })}
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
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
