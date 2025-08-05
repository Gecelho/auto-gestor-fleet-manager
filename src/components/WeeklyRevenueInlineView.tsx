import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts";
import { format, startOfWeek, endOfWeek, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUpdateRevenue, useAddRevenue } from "@/hooks/useRevenues";
import { Loader2, Edit, Trash2 } from "lucide-react";
import { EditRevenueDialog } from "@/components/EditRevenueDialog";
import { DeleteRevenueDialog } from "@/components/DeleteRevenueDialog";
import { displayCurrency, formatCurrency } from "@/lib/formatters";

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

// Componente customizado para o tick do XAxis
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const data = payload.value.split('\n');
  const dayName = data[0];
  const dayNumber = data[1];
  
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Mobile: duas linhas */}
      <text 
        x={0} 
        y={0} 
        dy={4} 
        textAnchor="middle" 
        fill="hsl(var(--muted-foreground))" 
        fontSize="11" 
        fontWeight="500"
        className="sm:hidden"
      >
        <tspan x={0} dy={0}>{dayName}</tspan>
        <tspan x={0} dy={10}>{dayNumber}</tspan>
      </text>
      
      {/* Desktop: uma linha */}
      <text 
        x={0} 
        y={0} 
        dy={4} 
        textAnchor="middle" 
        fill="hsl(var(--muted-foreground))" 
        fontSize="11" 
        fontWeight="500"
        className="hidden sm:block"
      >
        {`${dayName} ${dayNumber}`}
      </text>
    </g>
  );
};

export function WeeklyRevenueInlineView({ revenues, carId }: WeeklyRevenueInlineViewProps) {
  // Função para truncar texto
  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };
  const [editingWeeks, setEditingWeeks] = useState<{ [key: string]: { [key: string]: { formatted: string; numeric: number } } }>({});
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
      const values: { [key: string]: { formatted: string; numeric: number } } = {};
      for (let i = 0; i < 7; i++) {
        const day = addDays(week.weekStart, i);
        const dayKey = format(day, 'yyyy-MM-dd');
        const numericValue = week.dailyValues[dayKey] || 0;
        values[dayKey] = {
          formatted: formatCurrency((numericValue * 100).toString()),
          numeric: numericValue
        };
      }
      setEditingWeeks(prev => ({
        ...prev,
        [weekKey]: values
      }));
    }
  };

  const handleDailyValueChange = (weekKey: string, dayKey: string, formatted: string, numeric: number) => {
    setEditingWeeks(prev => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [dayKey]: { formatted, numeric }
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
        const newValue = editingWeeks[weekKey][dayKey]?.numeric || 0;
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
    <div className="space-y-6">
      {sortedWeeks.map((week) => {
        const weekKey = format(week.weekStart, 'yyyy-MM-dd');
        
        const chartData = [];
        for (let i = 0; i < 7; i++) {
          const day = addDays(week.weekStart, i);
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayNumber = format(day, 'dd');
          const currentValue = editingWeeks[weekKey]?.[dayKey]?.numeric ?? week.dailyValues[dayKey] ?? 0;
          
          chartData.push({
            day: `${dayNames[i]}\n${dayNumber}`,
            dayMobile: dayNames[i],
            dayNumber: dayNumber,
            value: currentValue,
            fullDate: format(day, 'dd/MM', { locale: ptBR }),
          });
        }

        return (
          <Card key={weekKey} className="p-4 mb-4 overflow-hidden">
            {/* Header da semana com botão de editar menor */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-base font-semibold">
                  {format(week.weekStart, 'dd', { locale: ptBR })} de {format(week.weekStart, 'MMM', { locale: ptBR })}. - {format(week.weekEnd, 'dd', { locale: ptBR })} de {format(week.weekEnd, 'MMM', { locale: ptBR })}.
                </h4>
                <p className="text-sm text-muted-foreground">
                  {week.revenues.length} receita(s) • Total: {displayCurrency(week.totalValue)}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 flex-shrink-0"
                onClick={() => handleEditToggle(weekKey, week)}
              >
                <Edit className="w-3 h-3" />
              </Button>
            </div>

            {/* Gráfico com altura maior para melhor visualização */}
            <div className="h-64 w-full mb-3 overflow-hidden relative">
              <ChartContainer
                config={{
                  value: {
                    label: "Receita",
                    color: "#4285F4",
                  },
                }}
                className="h-full w-full relative z-0"
              >
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 25, right: 20, left: 20, bottom: 2 }}
                    barCategoryGap="15%"
                  >
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      tick={<CustomXAxisTick />}
                      interval={0}
                      height={30}
                    />
                    <YAxis hide />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--success))" 
                      radius={[3, 3, 0, 0]}
                      barSize={15}
                      maxBarSize={20}
                    >
                      <LabelList 
                        dataKey="value" 
                        position="top" 
                        formatter={(value: number) => value > 0 ? `R$ ${value.toLocaleString('pt-BR')}` : ''}
                        style={{ 
                          fontSize: '10px', 
                          fontWeight: '600', 
                          fill: 'hsl(var(--card-foreground))' 
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Lista de receitas individuais com botões de edição */}
            {week.revenues.length > 0 && (
              <div className="space-y-2 mb-4 clear-both">
                <h5 className="text-sm font-medium text-muted-foreground mb-3">Receitas da semana:</h5>
                <div className="space-y-2">
                  {week.revenues.map((revenue) => (
                    <div key={revenue.id} className="bg-muted rounded-lg p-3">
                      {/* Layout Desktop - horizontal */}
                      <div className="hidden sm:flex items-center justify-between min-h-[60px]">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-medium" title={revenue.description}>
                            {truncateText(revenue.description)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(revenue.date), 'dd/MM/yyyy', { locale: ptBR })} • {revenue.type}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="text-sm font-bold text-success whitespace-nowrap">
                            {displayCurrency(revenue.value)}
                          </span>
                          <EditRevenueDialog revenue={revenue as any} />
                          <DeleteRevenueDialog 
                            revenueId={revenue.id}
                            revenueDescription={revenue.description}
                          />
                        </div>
                      </div>

                      {/* Layout Mobile - vertical */}
                      <div className="sm:hidden space-y-1.5">
                        {/* Primeira linha: Descrição e valor */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-sm font-medium leading-tight" title={revenue.description}>
                              {truncateText(revenue.description, 25)}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-success whitespace-nowrap">
                            {displayCurrency(revenue.value)}
                          </span>
                        </div>
                        
                        {/* Segunda linha: Data/tipo e botões */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(revenue.date), 'dd/MM/yyyy', { locale: ptBR })} • {revenue.type}
                          </p>
                          <div className="flex items-center space-x-1">
                            <EditRevenueDialog revenue={revenue as any} />
                            <DeleteRevenueDialog 
                              revenueId={revenue.id}
                              revenueDescription={revenue.description}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inputs para edição rápida - só aparecem quando showingInputs[weekKey] é true */}
            {showingInputs[weekKey] && (
              <div className="space-y-3 border-t pt-4 mt-4">
                <div className="grid grid-cols-7 gap-2 max-md:grid-cols-3 max-md:gap-3 max-sm:grid-cols-2">
                  {chartData.map((dayData, index) => {
                    const day = addDays(week.weekStart, index);
                    const dayKey = format(day, 'yyyy-MM-dd');
                    
                    return (
                      <div key={dayKey} className="space-y-1">
                        <Label className="text-xs font-bold text-center block text-foreground">
                          {dayData.day}
                        </Label>
                        <CurrencyInput
                          value={editingWeeks[weekKey]?.[dayKey]?.formatted || '0,00'}
                          onChange={(formatted, numeric) => handleDailyValueChange(weekKey, dayKey, formatted, numeric)}
                          placeholder="0,00"
                          className="text-center text-xs h-8"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={() => handleSaveWeek(weekKey, week)} 
                    disabled={loadingWeeks[weekKey]}
                    size="sm"
                    className="mt-2"
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
