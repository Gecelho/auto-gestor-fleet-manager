// Função para formatar valores monetários em tempo real
export const formatCurrency = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para número e divide por 100 para ter os centavos
  const amount = parseInt(numbers) / 100;
  
  // Formata usando Intl.NumberFormat para o padrão brasileiro
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Função para formatar quilometragem em tempo real
export const formatMileage = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para número
  const mileage = parseInt(numbers);
  
  // Formata usando Intl.NumberFormat para o padrão brasileiro (apenas pontos para milhares)
  return new Intl.NumberFormat('pt-BR').format(mileage);
};

// Função para converter valor formatado de volta para número (para salvar no banco)
export const parseCurrency = (formattedValue: string): number => {
  if (!formattedValue) return 0;
  
  // Remove pontos e substitui vírgula por ponto
  const cleanValue = formattedValue.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

// Função para converter quilometragem formatada de volta para número
export const parseMileage = (formattedValue: string): number => {
  if (!formattedValue) return 0;
  
  // Remove pontos
  const cleanValue = formattedValue.replace(/\./g, '');
  return parseInt(cleanValue) || 0;
};

// Função para formatar valor monetário para exibição (já formatado do banco)
export const displayCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Função para formatar quilometragem para exibição
export const displayMileage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

// Função para formatar valor monetário de forma compacta (para mobile)
export const displayCompactCurrency = (value: number): string => {
  if (value >= 1000000) {
    // Para valores acima de R$ 1.000.000, remove os centavos e adiciona ...
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.floor(value)) + '...';
  } else {
    // Para valores até R$ 999.999,99, mostra completo
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
};