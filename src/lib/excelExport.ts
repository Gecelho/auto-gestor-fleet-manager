import * as XLSX from 'xlsx';
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { displayCurrency, displayMileage } from "./formatters";

// Função para criar estilos de célula
const createStyles = () => ({
  header: {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "2563EB" } }, // Azul
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  },
  subHeader: {
    font: { bold: true, color: { rgb: "1F2937" } },
    fill: { fgColor: { rgb: "F3F4F6" } }, // Cinza claro
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  },
  currency: {
    numFmt: 'R$ #,##0.00',
    alignment: { horizontal: "right" },
    border: {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } }
    }
  },
  positive: {
    numFmt: 'R$ #,##0.00',
    font: { color: { rgb: "059669" } }, // Verde
    alignment: { horizontal: "right" },
    border: {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } }
    }
  },
  negative: {
    numFmt: 'R$ #,##0.00',
    font: { color: { rgb: "DC2626" } }, // Vermelho
    alignment: { horizontal: "right" },
    border: {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } }
    }
  },
  date: {
    numFmt: 'dd/mm/yyyy',
    alignment: { horizontal: "center" },
    border: {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } }
    }
  },
  text: {
    alignment: { horizontal: "left" },
    border: {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } }
    }
  },
  center: {
    alignment: { horizontal: "center" },
    border: {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } }
    }
  }
});

// Função para ajustar largura das colunas
const autoFitColumns = (worksheet: XLSX.WorkSheet, data: any[][]) => {
  const colWidths: number[] = [];
  
  data.forEach(row => {
    row.forEach((cell, colIndex) => {
      const cellLength = String(cell || '').length;
      colWidths[colIndex] = Math.max(colWidths[colIndex] || 0, cellLength + 2);
    });
  });
  
  worksheet['!cols'] = colWidths.map(width => ({ width: Math.min(width, 50) }));
};

// Função para aplicar estilos a um range de células
const applyStyleToRange = (worksheet: XLSX.WorkSheet, range: string, style: any) => {
  const decoded = XLSX.utils.decode_range(range);
  for (let row = decoded.s.r; row <= decoded.e.r; row++) {
    for (let col = decoded.s.c; col <= decoded.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[cellAddress]) worksheet[cellAddress] = { v: '' };
      worksheet[cellAddress].s = style;
    }
  }
};

// Interface para dados de relatório mensal de carro específico
interface MonthlyReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  expenses: Array<{
    id: string;
    description: string;
    value: number;
    date: string;
    mileage?: number;
    observation?: string;
  }>;
  revenues: Array<{
    id: string;
    description: string;
    value: number;
    date: string;
    type: string;
  }>;
}

// Interface para dados de relatório por período
interface PeriodReportData extends MonthlyReportData {
  monthlyBreakdown?: Array<{
    month: string;
    monthName: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

// Interface para dados de relatório geral
interface GeneralReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  carBreakdown?: Array<{
    carId: string;
    carName: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

// Interface para dados de relatório geral por período
interface GeneralPeriodReportData extends GeneralReportData {
  monthlyBreakdown?: Array<{
    month: string;
    monthName: string;
    revenue: number;
    expenses: number;
    profit: number;
    carBreakdown?: Array<{
      carId: string;
      carName: string;
      revenue: number;
      expenses: number;
      profit: number;
    }>;
  }>;
}

// Interface para dados de carro da lista principal
interface CarData {
  id: string;
  name: string;
  plate: string;
  status: string;
  purchase_value: number;
  totalRevenue: number;
  totalExpenses: number;
  remainingBalance: number;
  driver?: {
    name: string;
    phone: string;
  };
}

// Exportar relatório mensal de carro específico em Excel
export const exportMonthlyReportExcel = (
  data: MonthlyReportData,
  carName: string,
  month: string,
  year: string
): void => {
  const monthYear = month ? format(new Date(month + '-01'), 'MMMM yyyy', { locale: ptBR }) : `Ano ${year}`;
  const filename = `relatorio_mensal_${carName.replace(/[^a-zA-Z0-9]/g, '_')}_${month || year}.xlsx`;
  const styles = createStyles();

  const workbook = XLSX.utils.book_new();

  // Aba 1: Resumo Financeiro
  const summaryData = [
    ['RELATÓRIO MENSAL - ' + carName.toUpperCase()],
    ['Período: ' + monthYear],
    ['Gerado em: ' + format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })],
    [],
    ['RESUMO FINANCEIRO'],
    ['Tipo', 'Valor'],
    ['Total de Receitas', data.totalRevenue],
    ['Total de Despesas', data.totalExpenses],
    [data.netProfit >= 0 ? 'Lucro Líquido' : 'Prejuízo', Math.abs(data.netProfit)]
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Aplicar estilos ao resumo
  applyStyleToRange(summaryWs, 'A5:B5', styles.header);
  applyStyleToRange(summaryWs, 'A6:B6', styles.subHeader);
  applyStyleToRange(summaryWs, 'B7:B9', styles.currency);
  
  // Colorir lucro/prejuízo
  const profitCell = 'B9';
  if (summaryWs[profitCell]) {
    summaryWs[profitCell].s = data.netProfit >= 0 ? styles.positive : styles.negative;
  }

  autoFitColumns(summaryWs, summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWs, 'Resumo');

  // Aba 2: Despesas Detalhadas
  if (data.expenses.length > 0) {
    const expensesData = [
      ['DESPESAS DETALHADAS'],
      [],
      ['Data', 'Descrição', 'Valor', 'Quilometragem', 'Observação'],
      ...data.expenses.map(expense => [
        new Date(expense.date),
        expense.description,
        expense.value,
        expense.mileage || '',
        expense.observation || ''
      ])
    ];

    const expensesWs = XLSX.utils.aoa_to_sheet(expensesData);
    
    // Aplicar estilos
    applyStyleToRange(expensesWs, 'A3:E3', styles.header);
    
    // Aplicar estilos às linhas de dados
    for (let i = 4; i <= data.expenses.length + 3; i++) {
      expensesWs[`A${i}`].s = styles.date;
      expensesWs[`B${i}`].s = styles.text;
      expensesWs[`C${i}`].s = styles.negative;
      expensesWs[`D${i}`].s = styles.center;
      expensesWs[`E${i}`].s = styles.text;
    }

    autoFitColumns(expensesWs, expensesData);
    XLSX.utils.book_append_sheet(workbook, expensesWs, 'Despesas');
  }

  // Aba 3: Receitas Detalhadas
  if (data.revenues.length > 0) {
    const revenuesData = [
      ['RECEITAS DETALHADAS'],
      [],
      ['Data', 'Descrição', 'Tipo', 'Valor'],
      ...data.revenues.map(revenue => [
        new Date(revenue.date),
        revenue.description,
        revenue.type,
        revenue.value
      ])
    ];

    const revenuesWs = XLSX.utils.aoa_to_sheet(revenuesData);
    
    // Aplicar estilos
    applyStyleToRange(revenuesWs, 'A3:D3', styles.header);
    
    // Aplicar estilos às linhas de dados
    for (let i = 4; i <= data.revenues.length + 3; i++) {
      revenuesWs[`A${i}`].s = styles.date;
      revenuesWs[`B${i}`].s = styles.text;
      revenuesWs[`C${i}`].s = styles.center;
      revenuesWs[`D${i}`].s = styles.positive;
    }

    autoFitColumns(revenuesWs, revenuesData);
    XLSX.utils.book_append_sheet(workbook, revenuesWs, 'Receitas');
  }

  // Salvar arquivo
  XLSX.writeFile(workbook, filename);
};

// Exportar relatório por período de carro específico em Excel
export const exportPeriodReportExcel = (
  data: PeriodReportData,
  carName: string,
  startMonth: string,
  endMonth: string
): void => {
  const startDate = format(new Date(startMonth + '-01'), 'MMM/yyyy', { locale: ptBR });
  const endDate = format(new Date(endMonth + '-01'), 'MMM/yyyy', { locale: ptBR });
  const filename = `relatorio_periodo_${carName.replace(/[^a-zA-Z0-9]/g, '_')}_${startMonth}_${endMonth}.xlsx`;
  const styles = createStyles();

  const workbook = XLSX.utils.book_new();

  // Aba 1: Resumo Financeiro
  const summaryData = [
    ['RELATÓRIO POR PERÍODO - ' + carName.toUpperCase()],
    ['Período: ' + startDate + ' a ' + endDate],
    ['Gerado em: ' + format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })],
    [],
    ['RESUMO FINANCEIRO'],
    ['Tipo', 'Valor'],
    ['Total de Receitas', data.totalRevenue],
    ['Total de Despesas', data.totalExpenses],
    [data.netProfit >= 0 ? 'Lucro Líquido' : 'Prejuízo', Math.abs(data.netProfit)]
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Aplicar estilos
  applyStyleToRange(summaryWs, 'A5:B5', styles.header);
  applyStyleToRange(summaryWs, 'A6:B6', styles.subHeader);
  applyStyleToRange(summaryWs, 'B7:B9', styles.currency);
  
  // Colorir lucro/prejuízo
  const profitCell = 'B9';
  if (summaryWs[profitCell]) {
    summaryWs[profitCell].s = data.netProfit >= 0 ? styles.positive : styles.negative;
  }

  autoFitColumns(summaryWs, summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWs, 'Resumo');

  // Aba 2: Resumo por Mês (se disponível)
  if (data.monthlyBreakdown && data.monthlyBreakdown.length > 0) {
    const monthlyData = [
      ['RESUMO POR MÊS'],
      [],
      ['Mês', 'Receitas', 'Despesas', 'Resultado'],
      ...data.monthlyBreakdown.map(month => [
        month.monthName,
        month.revenue,
        month.expenses,
        month.profit
      ])
    ];

    const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyData);
    
    // Aplicar estilos
    applyStyleToRange(monthlyWs, 'A3:D3', styles.header);
    
    // Aplicar estilos às linhas de dados
    for (let i = 4; i <= data.monthlyBreakdown.length + 3; i++) {
      monthlyWs[`A${i}`].s = styles.center;
      monthlyWs[`B${i}`].s = styles.positive;
      monthlyWs[`C${i}`].s = styles.negative;
      
      // Colorir resultado baseado no valor
      const profitValue = data.monthlyBreakdown[i - 4].profit;
      monthlyWs[`D${i}`].s = profitValue >= 0 ? styles.positive : styles.negative;
    }

    autoFitColumns(monthlyWs, monthlyData);
    XLSX.utils.book_append_sheet(workbook, monthlyWs, 'Por Mês');
  }

  // Aba 3: Despesas Detalhadas
  if (data.expenses.length > 0) {
    const expensesData = [
      ['DESPESAS DETALHADAS'],
      [],
      ['Data', 'Descrição', 'Valor', 'Quilometragem', 'Observação'],
      ...data.expenses.map(expense => [
        new Date(expense.date),
        expense.description,
        expense.value,
        expense.mileage || '',
        expense.observation || ''
      ])
    ];

    const expensesWs = XLSX.utils.aoa_to_sheet(expensesData);
    
    // Aplicar estilos
    applyStyleToRange(expensesWs, 'A3:E3', styles.header);
    
    // Aplicar estilos às linhas de dados
    for (let i = 4; i <= data.expenses.length + 3; i++) {
      expensesWs[`A${i}`].s = styles.date;
      expensesWs[`B${i}`].s = styles.text;
      expensesWs[`C${i}`].s = styles.negative;
      expensesWs[`D${i}`].s = styles.center;
      expensesWs[`E${i}`].s = styles.text;
    }

    autoFitColumns(expensesWs, expensesData);
    XLSX.utils.book_append_sheet(workbook, expensesWs, 'Despesas');
  }

  // Aba 4: Receitas Detalhadas
  if (data.revenues.length > 0) {
    const revenuesData = [
      ['RECEITAS DETALHADAS'],
      [],
      ['Data', 'Descrição', 'Tipo', 'Valor'],
      ...data.revenues.map(revenue => [
        new Date(revenue.date),
        revenue.description,
        revenue.type,
        revenue.value
      ])
    ];

    const revenuesWs = XLSX.utils.aoa_to_sheet(revenuesData);
    
    // Aplicar estilos
    applyStyleToRange(revenuesWs, 'A3:D3', styles.header);
    
    // Aplicar estilos às linhas de dados
    for (let i = 4; i <= data.revenues.length + 3; i++) {
      revenuesWs[`A${i}`].s = styles.date;
      revenuesWs[`B${i}`].s = styles.text;
      revenuesWs[`C${i}`].s = styles.center;
      revenuesWs[`D${i}`].s = styles.positive;
    }

    autoFitColumns(revenuesWs, revenuesData);
    XLSX.utils.book_append_sheet(workbook, revenuesWs, 'Receitas');
  }

  // Salvar arquivo
  XLSX.writeFile(workbook, filename);
};

// Exportar relatório geral mensal em Excel
export const exportGeneralMonthlyReportExcel = (
  data: GeneralReportData,
  month: string,
  year: string,
  isAllCars: boolean = true
): void => {
  const monthYear = month ? format(new Date(month + '-01'), 'MMMM yyyy', { locale: ptBR }) : `Ano ${year}`;
  const filename = `relatorio_geral_mensal_${month || year}.xlsx`;
  const styles = createStyles();

  const workbook = XLSX.utils.book_new();

  // Aba 1: Resumo Geral
  const summaryData = [
    ['RELATÓRIO GERAL DA FROTA'],
    ['Período: ' + monthYear],
    ['Escopo: ' + (isAllCars ? 'Todos os carros' : 'Carros selecionados')],
    ['Gerado em: ' + format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })],
    [],
    ['RESUMO GERAL'],
    ['Tipo', 'Valor'],
    ['Total de Receitas', data.totalRevenue],
    ['Total de Despesas', data.totalExpenses],
    [data.netProfit >= 0 ? 'Lucro Líquido' : 'Prejuízo', Math.abs(data.netProfit)]
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Aplicar estilos
  applyStyleToRange(summaryWs, 'A6:B6', styles.header);
  applyStyleToRange(summaryWs, 'A7:B7', styles.subHeader);
  applyStyleToRange(summaryWs, 'B8:B10', styles.currency);
  
  // Colorir lucro/prejuízo
  const profitCell = 'B10';
  if (summaryWs[profitCell]) {
    summaryWs[profitCell].s = data.netProfit >= 0 ? styles.positive : styles.negative;
  }

  autoFitColumns(summaryWs, summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWs, 'Resumo Geral');

  // Aba 2: Detalhes por Carro
  if (data.carBreakdown && data.carBreakdown.length > 0) {
    const carData = [
      ['DETALHES POR CARRO'],
      [],
      ['Carro', 'Receitas', 'Despesas', 'Resultado'],
      ...data.carBreakdown.map(car => [
        car.carName,
        car.revenue,
        car.expenses,
        car.profit
      ])
    ];

    const carWs = XLSX.utils.aoa_to_sheet(carData);
    
    // Aplicar estilos
    applyStyleToRange(carWs, 'A3:D3', styles.header);
    
    // Aplicar estilos às linhas de dados
    for (let i = 4; i <= data.carBreakdown.length + 3; i++) {
      carWs[`A${i}`].s = styles.text;
      carWs[`B${i}`].s = styles.positive;
      carWs[`C${i}`].s = styles.negative;
      
      // Colorir resultado baseado no valor
      const profitValue = data.carBreakdown[i - 4].profit;
      carWs[`D${i}`].s = profitValue >= 0 ? styles.positive : styles.negative;
    }

    autoFitColumns(carWs, carData);
    XLSX.utils.book_append_sheet(workbook, carWs, 'Por Carro');
  }

  // Salvar arquivo
  XLSX.writeFile(workbook, filename);
};

// Exportar relatório geral por período em Excel
export const exportGeneralPeriodReportExcel = (
  data: GeneralPeriodReportData,
  startMonth: string,
  endMonth: string,
  isAllCars: boolean = true
): void => {
  const startDate = format(new Date(startMonth + '-01'), 'MMM/yyyy', { locale: ptBR });
  const endDate = format(new Date(endMonth + '-01'), 'MMM/yyyy', { locale: ptBR });
  const filename = `relatorio_geral_periodo_${startMonth}_${endMonth}.xlsx`;
  const styles = createStyles();

  const workbook = XLSX.utils.book_new();

  // Aba 1: Resumo Geral
  const summaryData = [
    ['RELATÓRIO GERAL DA FROTA POR PERÍODO'],
    ['Período: ' + startDate + ' a ' + endDate],
    ['Escopo: ' + (isAllCars ? 'Todos os carros' : 'Carros selecionados')],
    ['Gerado em: ' + format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })],
    [],
    ['RESUMO GERAL'],
    ['Tipo', 'Valor'],
    ['Total de Receitas', data.totalRevenue],
    ['Total de Despesas', data.totalExpenses],
    [data.netProfit >= 0 ? 'Lucro Líquido' : 'Prejuízo', Math.abs(data.netProfit)]
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Aplicar estilos
  applyStyleToRange(summaryWs, 'A6:B6', styles.header);
  applyStyleToRange(summaryWs, 'A7:B7', styles.subHeader);
  applyStyleToRange(summaryWs, 'B8:B10', styles.currency);
  
  // Colorir lucro/prejuízo
  const profitCell = 'B10';
  if (summaryWs[profitCell]) {
    summaryWs[profitCell].s = data.netProfit >= 0 ? styles.positive : styles.negative;
  }

  autoFitColumns(summaryWs, summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWs, 'Resumo Geral');

  // Aba 2: Resumo por Mês
  if (data.monthlyBreakdown && data.monthlyBreakdown.length > 0) {
    const monthlyData = [
      ['RESUMO POR MÊS'],
      [],
      ['Mês', 'Receitas', 'Despesas', 'Resultado'],
      ...data.monthlyBreakdown.map(month => [
        month.monthName,
        month.revenue,
        month.expenses,
        month.profit
      ])
    ];

    const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyData);
    
    // Aplicar estilos
    applyStyleToRange(monthlyWs, 'A3:D3', styles.header);
    
    // Aplicar estilos às linhas de dados
    for (let i = 4; i <= data.monthlyBreakdown.length + 3; i++) {
      monthlyWs[`A${i}`].s = styles.center;
      monthlyWs[`B${i}`].s = styles.positive;
      monthlyWs[`C${i}`].s = styles.negative;
      
      // Colorir resultado baseado no valor
      const profitValue = data.monthlyBreakdown[i - 4].profit;
      monthlyWs[`D${i}`].s = profitValue >= 0 ? styles.positive : styles.negative;
    }

    autoFitColumns(monthlyWs, monthlyData);
    XLSX.utils.book_append_sheet(workbook, monthlyWs, 'Por Mês');
  }

  // Aba 3: Detalhes por Carro
  if (data.carBreakdown && data.carBreakdown.length > 0) {
    const carData = [
      ['DETALHES POR CARRO'],
      [],
      ['Carro', 'Receitas', 'Despesas', 'Resultado'],
      ...data.carBreakdown.map(car => [
        car.carName,
        car.revenue,
        car.expenses,
        car.profit
      ])
    ];

    const carWs = XLSX.utils.aoa_to_sheet(carData);
    
    // Aplicar estilos
    applyStyleToRange(carWs, 'A3:D3', styles.header);
    
    // Aplicar estilos às linhas de dados
    for (let i = 4; i <= data.carBreakdown.length + 3; i++) {
      carWs[`A${i}`].s = styles.text;
      carWs[`B${i}`].s = styles.positive;
      carWs[`C${i}`].s = styles.negative;
      
      // Colorir resultado baseado no valor
      const profitValue = data.carBreakdown[i - 4].profit;
      carWs[`D${i}`].s = profitValue >= 0 ? styles.positive : styles.negative;
    }

    autoFitColumns(carWs, carData);
    XLSX.utils.book_append_sheet(workbook, carWs, 'Por Carro');
  }

  // Aba 4: Matriz Mês x Carro (se disponível)
  if (data.monthlyBreakdown && data.monthlyBreakdown.some(month => month.carBreakdown)) {
    // Criar matriz com meses nas linhas e carros nas colunas
    const allCars = new Set<string>();
    data.monthlyBreakdown.forEach(month => {
      if (month.carBreakdown) {
        month.carBreakdown.forEach(car => allCars.add(car.carName));
      }
    });

    const carNames = Array.from(allCars).sort();
    const matrixData = [
      ['MATRIZ MÊS x CARRO (RESULTADOS)'],
      [],
      ['Mês', ...carNames, 'Total do Mês']
    ];

    data.monthlyBreakdown.forEach(month => {
      const row = [month.monthName];
      let monthTotal = 0;
      
      carNames.forEach(carName => {
        const carData = month.carBreakdown?.find(car => car.carName === carName);
        const profit = carData?.profit || 0;
        row.push(profit);
        monthTotal += profit;
      });
      
      row.push(monthTotal);
      matrixData.push(row);
    });

    // Adicionar linha de totais por carro
    const totalsRow = ['Total por Carro'];
    let grandTotal = 0;
    
    carNames.forEach(carName => {
      let carTotal = 0;
      data.monthlyBreakdown?.forEach(month => {
        const carData = month.carBreakdown?.find(car => car.carName === carName);
        carTotal += carData?.profit || 0;
      });
      totalsRow.push(carTotal);
      grandTotal += carTotal;
    });
    
    totalsRow.push(grandTotal);
    matrixData.push(totalsRow);

    const matrixWs = XLSX.utils.aoa_to_sheet(matrixData);
    
    // Aplicar estilos
    const headerRange = `A3:${String.fromCharCode(65 + carNames.length + 1)}3`;
    applyStyleToRange(matrixWs, headerRange, styles.header);
    
    // Aplicar estilos às células de dados
    for (let i = 4; i <= matrixData.length; i++) {
      matrixWs[`A${i}`].s = styles.center; // Mês
      
      // Valores dos carros
      for (let j = 1; j <= carNames.length + 1; j++) {
        const cellAddress = String.fromCharCode(65 + j) + i;
        if (matrixWs[cellAddress]) {
          const value = matrixWs[cellAddress].v;
          matrixWs[cellAddress].s = value >= 0 ? styles.positive : styles.negative;
        }
      }
    }

    autoFitColumns(matrixWs, matrixData);
    XLSX.utils.book_append_sheet(workbook, matrixWs, 'Matriz Mês x Carro');
  }

  // Salvar arquivo
  XLSX.writeFile(workbook, filename);
};

// Exportar visão geral da frota em Excel
export const exportFleetOverviewExcel = (cars: CarData[]): void => {
  const filename = `visao_geral_frota_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  const styles = createStyles();

  const workbook = XLSX.utils.book_new();

  // Calcular totais
  const totals = cars.reduce((acc, car) => ({
    totalRevenue: acc.totalRevenue + car.totalRevenue,
    totalExpenses: acc.totalExpenses + car.totalExpenses,
    totalPurchaseValue: acc.totalPurchaseValue + car.purchase_value,
    totalRemainingBalance: acc.totalRemainingBalance + car.remainingBalance
  }), { 
    totalRevenue: 0, 
    totalExpenses: 0, 
    totalPurchaseValue: 0,
    totalRemainingBalance: 0 
  });

  const netProfit = totals.totalRevenue - totals.totalExpenses;

  // Aba 1: Resumo Geral
  const summaryData = [
    ['VISÃO GERAL DA FROTA'],
    ['Gerado em: ' + format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })],
    ['Total de Carros: ' + cars.length],
    [],
    ['RESUMO FINANCEIRO GERAL'],
    ['Tipo', 'Valor'],
    ['Valor Total de Compra', totals.totalPurchaseValue],
    ['Total de Receitas', totals.totalRevenue],
    ['Total de Despesas', totals.totalExpenses],
    [netProfit >= 0 ? 'Lucro Líquido Total' : 'Prejuízo Total', Math.abs(netProfit)],
    ['Saldo Pendente Total', totals.totalRemainingBalance]
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Aplicar estilos
  applyStyleToRange(summaryWs, 'A5:B5', styles.header);
  applyStyleToRange(summaryWs, 'A6:B6', styles.subHeader);
  applyStyleToRange(summaryWs, 'B7:B11', styles.currency);
  
  // Colorir lucro/prejuízo
  const profitCell = 'B10';
  if (summaryWs[profitCell]) {
    summaryWs[profitCell].s = netProfit >= 0 ? styles.positive : styles.negative;
  }

  autoFitColumns(summaryWs, summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWs, 'Resumo Geral');

  // Aba 2: Detalhes por Carro
  const carData = [
    ['DETALHES POR CARRO'],
    [],
    ['Nome', 'Placa', 'Status', 'Valor de Compra', 'Total Receitas', 'Total Despesas', 'Resultado', 'Saldo Pendente', 'Motorista', 'Telefone'],
    ...cars.map(car => {
      const carNetProfit = car.totalRevenue - car.totalExpenses;
      return [
        car.name,
        car.plate,
        car.status,
        car.purchase_value,
        car.totalRevenue,
        car.totalExpenses,
        carNetProfit,
        car.remainingBalance,
        car.driver?.name || 'Não definido',
        car.driver?.phone || ''
      ];
    })
  ];

  const carWs = XLSX.utils.aoa_to_sheet(carData);
  
  // Aplicar estilos
  applyStyleToRange(carWs, 'A3:J3', styles.header);
  
  // Aplicar estilos às linhas de dados
  for (let i = 4; i <= cars.length + 3; i++) {
    carWs[`A${i}`].s = styles.text; // Nome
    carWs[`B${i}`].s = styles.center; // Placa
    carWs[`C${i}`].s = styles.center; // Status
    carWs[`D${i}`].s = styles.currency; // Valor de Compra
    carWs[`E${i}`].s = styles.positive; // Receitas
    carWs[`F${i}`].s = styles.negative; // Despesas
    
    // Resultado - colorir baseado no valor
    const carNetProfit = cars[i - 4].totalRevenue - cars[i - 4].totalExpenses;
    carWs[`G${i}`].s = carNetProfit >= 0 ? styles.positive : styles.negative;
    
    carWs[`H${i}`].s = styles.currency; // Saldo Pendente
    carWs[`I${i}`].s = styles.text; // Motorista
    carWs[`J${i}`].s = styles.center; // Telefone
  }

  autoFitColumns(carWs, carData);
  XLSX.utils.book_append_sheet(workbook, carWs, 'Detalhes por Carro');

  // Aba 3: Estatísticas por Status
  const statusStats = cars.reduce((acc, car) => {
    acc[car.status] = (acc[car.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(statusStats).length > 0) {
    const statusData = [
      ['ESTATÍSTICAS POR STATUS'],
      [],
      ['Status', 'Quantidade', 'Percentual'],
      ...Object.entries(statusStats).map(([status, count]) => [
        status,
        count,
        `${((count / cars.length) * 100).toFixed(1)}%`
      ])
    ];

    const statusWs = XLSX.utils.aoa_to_sheet(statusData);
    
    // Aplicar estilos
    applyStyleToRange(statusWs, 'A3:C3', styles.header);
    
    // Aplicar estilos às linhas de dados
    for (let i = 4; i <= Object.keys(statusStats).length + 3; i++) {
      statusWs[`A${i}`].s = styles.center;
      statusWs[`B${i}`].s = styles.center;
      statusWs[`C${i}`].s = styles.center;
    }

    autoFitColumns(statusWs, statusData);
    XLSX.utils.book_append_sheet(workbook, statusWs, 'Por Status');
  }

  // Salvar arquivo
  XLSX.writeFile(workbook, filename);
};

// Exportar apenas despesas de um carro em Excel
export const exportExpensesExcel = (
  expenses: Array<{
    id: string;
    description: string;
    value: number;
    date: string;
    mileage?: number;
    observation?: string;
  }>,
  carName: string
): void => {
  const filename = `despesas_${carName.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  const styles = createStyles();

  const workbook = XLSX.utils.book_new();

  // Resumo
  const totalValue = expenses.reduce((sum, expense) => sum + expense.value, 0);
  const summaryData = [
    ['DESPESAS - ' + carName.toUpperCase()],
    ['Gerado em: ' + format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })],
    ['Total de Despesas: ' + expenses.length],
    [],
    ['RESUMO'],
    ['Total Gasto', totalValue],
    ['Valor Médio por Despesa', totalValue / expenses.length]
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Aplicar estilos
  applyStyleToRange(summaryWs, 'A5:B5', styles.header);
  applyStyleToRange(summaryWs, 'B6:B7', styles.negative);

  autoFitColumns(summaryWs, summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWs, 'Resumo');

  // Despesas detalhadas
  const expensesData = [
    ['DESPESAS DETALHADAS'],
    [],
    ['Data', 'Descrição', 'Valor', 'Quilometragem', 'Observação'],
    ...expenses.map(expense => [
      new Date(expense.date),
      expense.description,
      expense.value,
      expense.mileage || '',
      expense.observation || ''
    ])
  ];

  const expensesWs = XLSX.utils.aoa_to_sheet(expensesData);
  
  // Aplicar estilos
  applyStyleToRange(expensesWs, 'A3:E3', styles.header);
  
  // Aplicar estilos às linhas de dados
  for (let i = 4; i <= expenses.length + 3; i++) {
    expensesWs[`A${i}`].s = styles.date;
    expensesWs[`B${i}`].s = styles.text;
    expensesWs[`C${i}`].s = styles.negative;
    expensesWs[`D${i}`].s = styles.center;
    expensesWs[`E${i}`].s = styles.text;
  }

  autoFitColumns(expensesWs, expensesData);
  XLSX.utils.book_append_sheet(workbook, expensesWs, 'Despesas');

  // Salvar arquivo
  XLSX.writeFile(workbook, filename);
};

// Exportar apenas receitas de um carro em Excel
export const exportRevenuesExcel = (
  revenues: Array<{
    id: string;
    description: string;
    value: number;
    date: string;
    type: string;
  }>,
  carName: string
): void => {
  const filename = `receitas_${carName.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  const styles = createStyles();

  const workbook = XLSX.utils.book_new();

  // Resumo
  const totalValue = revenues.reduce((sum, revenue) => sum + revenue.value, 0);
  const summaryData = [
    ['RECEITAS - ' + carName.toUpperCase()],
    ['Gerado em: ' + format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })],
    ['Total de Receitas: ' + revenues.length],
    [],
    ['RESUMO'],
    ['Total Arrecadado', totalValue],
    ['Valor Médio por Receita', totalValue / revenues.length]
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Aplicar estilos
  applyStyleToRange(summaryWs, 'A5:B5', styles.header);
  applyStyleToRange(summaryWs, 'B6:B7', styles.positive);

  autoFitColumns(summaryWs, summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWs, 'Resumo');

  // Resumo por tipo (se há mais de um tipo)
  const typeStats = revenues.reduce((acc, revenue) => {
    acc[revenue.type] = (acc[revenue.type] || 0) + revenue.value;
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(typeStats).length > 1) {
    const typeData = [
      ['RESUMO POR TIPO'],
      [],
      ['Tipo', 'Total', 'Percentual'],
      ...Object.entries(typeStats).map(([type, value]) => [
        type,
        value,
        `${((value / totalValue) * 100).toFixed(1)}%`
      ])
    ];

    const typeWs = XLSX.utils.aoa_to_sheet(typeData);
    
    // Aplicar estilos
    applyStyleToRange(typeWs, 'A3:C3', styles.header);
    
    // Aplicar estilos às linhas de dados
    for (let i = 4; i <= Object.keys(typeStats).length + 3; i++) {
      typeWs[`A${i}`].s = styles.center;
      typeWs[`B${i}`].s = styles.positive;
      typeWs[`C${i}`].s = styles.center;
    }

    autoFitColumns(typeWs, typeData);
    XLSX.utils.book_append_sheet(workbook, typeWs, 'Por Tipo');
  }

  // Receitas detalhadas
  const revenuesData = [
    ['RECEITAS DETALHADAS'],
    [],
    ['Data', 'Descrição', 'Tipo', 'Valor'],
    ...revenues.map(revenue => [
      new Date(revenue.date),
      revenue.description,
      revenue.type,
      revenue.value
    ])
  ];

  const revenuesWs = XLSX.utils.aoa_to_sheet(revenuesData);
  
  // Aplicar estilos
  applyStyleToRange(revenuesWs, 'A3:D3', styles.header);
  
  // Aplicar estilos às linhas de dados
  for (let i = 4; i <= revenues.length + 3; i++) {
    revenuesWs[`A${i}`].s = styles.date;
    revenuesWs[`B${i}`].s = styles.text;
    revenuesWs[`C${i}`].s = styles.center;
    revenuesWs[`D${i}`].s = styles.positive;
  }

  autoFitColumns(revenuesWs, revenuesData);
  XLSX.utils.book_append_sheet(workbook, revenuesWs, 'Receitas');

  // Salvar arquivo
  XLSX.writeFile(workbook, filename);
};