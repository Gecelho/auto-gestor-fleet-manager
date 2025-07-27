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
import { Loader2, Edit, Trash2 } from "lucide-react";
import { EditRevenueDialog } from "@/components/EditRevenueDialog";
import { DeleteRevenueDialog } from "@/components/DeleteRevenueDialog";

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
  const [showingInputs, setShowingInputs] = useState<{ [key: string]: boolean }>({});

  const updateRevenueMutation = useUpdateRevenue();
  const addRevenueMutation = useAddRevenue();

  const weeklyData = revenues.reduce((weeks: { [key: string]: WeekData }, revenue) => {
    const revenueDate = parseISO(revenue.date);
    const weekStart = startOfWeek(revenueDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(revenueDate, { weekStartsOn: 1 });
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

  const handleEditToggle = (weekKey: string, week: WeekData) => {
    if (!showingInputs[weekKey]) {
      initializeEditingWeek(weekKey, week);
    }
    setShowingInputs(prev => ({
      ...prev,
      [weekKey]: !prev[weekKey]
    }));
  };

  const handleSaveWeek = async (weekKey: string, week: WeekData) => {
    if (!editingWeeks[weekKey]) return;

    setLoadingWeeks(prev => ({ ...prev, [weekKey]: true }));

    try {
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
      setShowingInputs(prev => ({ ...prev, [weekKey]: false }));
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

        return (
          <Card key={weekKey} className="p-4">
            {/* Header da semana com botão de editar menor */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-base font-semibold">
                  {format(week.weekStart, 'dd', { locale: ptBR })} de {format(week.weekStart, 'MMM', { locale: ptBR })}. - {format(week.weekEnd, 'dd', { locale: ptBR })} de {format(week.weekEnd, 'MMM', { locale: ptBR })}.
                </h4>
                <p className="text-sm text-muted-foreground">
                  {week.revenues.length} receita(s) • Total: R$ {week.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => handleEditToggle(weekKey, week)}
              >
                <Edit className="w-3 h-3" />
              </Button>
            </div>

            {/* Gráfico ajustado com melhor espaçamento */}
            <div className="h-20 w-full mb-4">
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
                    margin={{ top: 5, right: 2, left: 2, bottom: 35 }}
                    barCategoryGap="15%"
                  >
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: '#000', fontWeight: 'bold' }}
                      interval={0}
                      height={30}
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
                      barSize={6}
                      maxBarSize={6}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Lista de receitas individuais com botões de edição */}
            {week.revenues.length > 0 && (
              <div className="space-y-2 mb-4">
                <h5 className="text-sm font-medium text-muted-foreground">Receitas da semana:</h5>
                {week.revenues.map((revenue) => (
                  <div key={revenue.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{revenue.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(revenue.date), 'dd/MM/yyyy', { locale: ptBR })} • {revenue.type}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-success">
                        R$ {Number(revenue.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <EditRevenueDialog revenue={revenue as any} />
                      <DeleteRevenueDialog 
                        revenueId={revenue.id}
                        revenueDescription={revenue.description}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inputs para edição rápida - só aparecem quando showingInputs[weekKey] é true */}
            {showingInputs[weekKey] && (
              <div className="space-y-3 border-t pt-4">
                <div className="grid grid-cols-7 gap-2 max-md:grid-cols-2 max-md:gap-3">
                  {chartData.map((dayData, index) => {
                    const day = addDays(week.weekStart, index);
                    const dayKey = format(day, 'yyyy-MM-dd');
                    
                    return (
                      <div key={dayKey} className="space-y-1">
                        <Label className="text-xs font-bold text-center block text-foreground">
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

                <div className="flex justify-end pt-2">
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
            )}
          </Card>
        );
      })}
    </div>
  );
}
