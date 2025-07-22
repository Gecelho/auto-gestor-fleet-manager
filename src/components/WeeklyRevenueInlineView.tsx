
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, startOfWeek, endOfWeek, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUpdateRevenue, useAddRevenue } from "@/hooks/useRevenues";
import { Loader2 } from "lucide-react";

interface Revenue {
  id: string;
  car_id: string;
  description: string;
  value: number;
  date: string;
  type: string;
  created_at: string;
}

interface WeeklyRevenueInlineViewProps {
  revenues: Revenue[];
  carId: string;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  totalValue: number;
  dailyValues: { [key: string]: number };
  revenues: Revenue[];
}

const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function WeeklyRevenueInlineView({ revenues, carId }: WeeklyRevenueInlineViewProps) {
  const [editingWeeks, setEditingWeeks] = useState<{ [key: string]: { [key: string]: string } }>({});
  const [loadingWeeks, setLoadingWeeks] = useState<{ [key: string]: boolean }>({});

  const updateRevenueMutation = useUpdateRevenue();
  const addRevenueMutation = useAddRevenue();

  // Agrupar receitas por semana
  const weeklyData = revenues.reduce((weeks: { [key: string]: WeekData }, revenue) => {
    const revenueDate = parseISO(revenue.date);
    const weekStart = startOfWeek(revenueDate, { weekStartsOn: 1 }); // Segunda-feira
    const weekEnd = endOfWeek(revenueDate, { weekStartsOn: 1 }); // Domingo
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        weekStart,
        weekEnd,
        totalValue: 0,
        dailyValues: {},
        revenues: []
      };
    }

    weeks[weekKey].totalValue += Number(revenue.value);
    weeks[weekKey].revenues.push(revenue);
    
    const dayKey = format(revenueDate, 'yyyy-MM-dd');
    weeks[weekKey].dailyValues[dayKey] = (weeks[weekKey].dailyValues[dayKey] || 0) + Number(revenue.value);

    return weeks;
  }, {});

  const sortedWeeks = Object.values(weeklyData).sort((a, b) => 
    b.weekStart.getTime() - a.weekStart.getTime()
  );

  const initializeEditingWeek = (weekKey: string, week: WeekData) => {
    if (!editingWeeks[weekKey]) {
      const values: { [key: string]: string } = {};
      for (let i = 0; i < 7; i++) {
        const day = addDays(week.weekStart, i);
        const dayKey = format(day, 'yyyy-MM-dd');
        values[dayKey] = (week.dailyValues[dayKey] || 0).toString();
      }
      setEditingWeeks(prev => ({
        ...prev,
        [weekKey]: values
      }));
    }
  };

  const handleDailyValueChange = (weekKey: string, dayKey: string, value: string) => {
    setEditingWeeks(prev => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [dayKey]: value
      }
    }));
  };

  const handleSaveWeek = async (weekKey: string, week: WeekData) => {
    if (!editingWeeks[weekKey]) return;

    setLoadingWeeks(prev => ({ ...prev, [weekKey]: true }));

    try {
      // Para cada dia da semana, verificar se precisa atualizar ou criar receita
      for (let i = 0; i < 7; i++) {
        const day = addDays(week.weekStart, i);
        const dayKey = format(day, 'yyyy-MM-dd');
        const newValue = parseFloat(editingWeeks[weekKey][dayKey]) || 0;
        const existingValue = week.dailyValues[dayKey] || 0;

        if (newValue !== existingValue) {
          const dayRevenues = week.revenues.filter(r => r.date === dayKey);
          
          if (dayRevenues.length > 0) {
            const revenue = dayRevenues[0];
            await updateRevenueMutation.mutateAsync({
              id: revenue.id,
              description: revenue.description,
              value: newValue,
              date: dayKey,
              type: revenue.type
            });
          } else if (newValue > 0) {
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
    } catch (error) {
      console.error('Error saving weekly revenue:', error);
    } finally {
      setLoadingWeeks(prev => ({ ...prev, [weekKey]: false }));
    }
  };

  if (sortedWeeks.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">Nenhuma receita cadastrada</p>
    );
  }

  return (
    <div className="space-y-4">
      {sortedWeeks.map((week) => {
        const weekKey = format(week.weekStart, 'yyyy-MM-dd');
        
        // Preparar dados para o gráfico
        const chartData = [];
        for (let i = 0; i < 7; i++) {
          const day = addDays(week.weekStart, i);
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayNumber = format(day, 'dd');
          const currentValue = editingWeeks[weekKey] ? 
            parseFloat(editingWeeks[weekKey][dayKey]) || 0 : 
            week.dailyValues[dayKey] || 0;
          
          chartData.push({
            day: `${dayNames[i]} ${dayNumber}`,
            value: currentValue,
            fullDate: format(day, 'dd/MM', { locale: ptBR }),
          });
        }

        // Inicializar valores de edição se necessário
        if (!editingWeeks[weekKey]) {
          initializeEditingWeek(weekKey, week);
        }

        return (
          <Card key={weekKey} className="p-3">
            {/* Header da semana - mais compacto */}
            <div className="mb-3">
              <h4 className="text-base font-semibold text-center">
                {format(week.weekStart, 'dd', { locale: ptBR })} de {format(week.weekStart, 'MMM', { locale: ptBR })}. - {format(week.weekEnd, 'dd', { locale: ptBR })} de {format(week.weekEnd, 'MMM', { locale: ptBR })}.
              </h4>
              <p className="text-xs text-muted-foreground text-center">
                {week.revenues.length} receita(s) • Total: R$ {week.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Gráfico muito mais compacto */}
            <div className="h-8 w-full mb-3">
              <ChartContainer
                config={{
                  value: {
                    label: "Receita",
                    color: "#4285F4",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 2, right: 4, left: 4, bottom: 20 }}
                    barCategoryGap="10%"
                  >
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 8, fill: '#666' }}
                      interval={0}
                      height={16}
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
                      fill="#4285F4" 
                      radius={[1, 1, 0, 0]}
                      barSize={8}
                      maxBarSize={8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Inputs organizados de forma compacta */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 max-md:grid-cols-2 max-md:gap-2">
                {chartData.map((dayData, index) => {
                  const day = addDays(week.weekStart, index);
                  const dayKey = format(day, 'yyyy-MM-dd');
                  
                  return (
                    <div key={dayKey} className="space-y-1">
                      <Label className="text-xs font-medium text-center block text-muted-foreground">
                        {dayData.day}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingWeeks[weekKey]?.[dayKey] || '0'}
                        onChange={(e) => handleDailyValueChange(weekKey, dayKey, e.target.value)}
                        placeholder="0.00"
                        className="text-center text-xs h-7"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Botão de salvar */}
              <div className="flex justify-end pt-1">
                <Button 
                  onClick={() => handleSaveWeek(weekKey, week)} 
                  disabled={loadingWeeks[weekKey]}
                  size="sm"
                >
                  {loadingWeeks[weekKey] && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
