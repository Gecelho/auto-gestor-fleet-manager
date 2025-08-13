
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { WeeklyRevenueEditDialog } from "./WeeklyRevenueEditDialog";
import { format, startOfWeek, endOfWeek, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Revenue {
  id: string;
  car_id: string;
  description: string;
  value: number;
  date: string;
  type: string;
  created_at: string;
}

interface WeeklyRevenueListProps {
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

export function WeeklyRevenueList({ revenues, carId }: WeeklyRevenueListProps) {
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);

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

  // Converter para array e ordenar por data
  const sortedWeeks = Object.values(weeklyData).sort((a, b) => 
    b.weekStart.getTime() - a.weekStart.getTime()
  );

  const handleEditWeek = (week: WeekData) => {
    setSelectedWeek(week);
  };

  return (
    <div className="space-y-3">
      {sortedWeeks.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhuma receita cadastrada</p>
      ) : (
        sortedWeeks.map((week) => (
          <div key={format(week.weekStart, 'yyyy-MM-dd')} className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">
                {format(week.weekStart, 'dd/MM', { locale: ptBR })} a {format(week.weekEnd, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">
                {week.revenues.length} receita(s) • Total da semana
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-success">
                R$ {week.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <Button variant="outline" size="sm" onClick={() => handleEditWeek(week)}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))
      )}

      {selectedWeek && (
        <WeeklyRevenueEditDialog
          week={selectedWeek}
          carId={carId}
          open={!!selectedWeek}
          onOpenChange={(open) => !open && setSelectedWeek(null)}
        />
      )}
    </div>
  );
}
