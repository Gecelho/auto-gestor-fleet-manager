import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LabelList } from "recharts";
import { format, startOfWeek, endOfWeek, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditRevenueDialog } from "@/components/EditRevenueDialog";
import { DeleteRevenueDialog } from "@/components/DeleteRevenueDialog";
import { displayCurrency } from "@/lib/formatters";

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
          const currentValue = week.dailyValues[dayKey] ?? 0;
          
          chartData.push({
            day: `${dayNames[i]}\n${dayNumber}`,
            dayMobile: dayNames[i],
            dayNumber: dayNumber,
            value: currentValue,
            fullDate: format(day, 'dd/MM', { locale: ptBR }),
          });
        }

        return (
          <div key={weekKey} className="bg-background border border-border rounded-xl p-6 mb-6">
            {/* Header da semana */}
            <div className="mb-4 sm:mb-6">
              <div className="flex-1 min-w-0">
                <h4 className="text-base sm:text-lg font-semibold text-foreground">
                  {format(week.weekStart, 'dd', { locale: ptBR })} de {format(week.weekStart, 'MMM', { locale: ptBR })}. - {format(week.weekEnd, 'dd', { locale: ptBR })} de {format(week.weekEnd, 'MMM', { locale: ptBR })}.
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {week.revenues.length} receita(s) • Total: {displayCurrency(week.totalValue)}
                </p>
              </div>
            </div>

            {/* Gráfico */}
            <div className="h-48 sm:h-64 w-full mb-4 sm:mb-6 overflow-hidden relative bg-muted rounded-xl p-4">
              <ChartContainer
                config={{
                  value: {
                    label: "Receita",
                    color: "hsl(var(--success))",
                  },
                }}
                className="h-full w-full"
              >
                <BarChart 
                  data={chartData} 
                  margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
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
                    radius={[4, 4, 0, 0]}
                    barSize={14}
                    maxBarSize={20}
                  >
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      formatter={(value: number) => value > 0 ? `R$ ${value.toLocaleString('pt-BR')}` : ''}
                      style={{ 
                        fontSize: '9px', 
                        fontWeight: '600', 
                        fill: 'hsl(var(--card-foreground))' 
                      }}
                    />
                  </Bar>
                </BarChart>
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


          </div>
        );
      })}
    </div>
  );
}
