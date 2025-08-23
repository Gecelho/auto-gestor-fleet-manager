/**
 * Sistema de segurança para inputs com validação, sanitização e limites de caracteres
 */

import { sanitizeString, containsMaliciousCode } from './security';

// Definição de limites lógicos para diferentes tipos de campos
export const INPUT_LIMITS = {
  // Campos básicos de identificação
  name: 100,
  title: 150,
  brand: 50,
  model: 50,
  
  // Campos de texto curto
  plate: 10,
  phone: 20,
  email: 254, // RFC 5321 limit
  cpf: 14,
  cnpj: 18,
  rg: 20,
  cnh: 15,
  
  // Campos numéricos (como string para validação)
  value: 20,
  price: 20,
  mileage: 10,
  year: 4,
  
  // Campos de endereço
  address: 200,
  city: 100,
  state: 50,
  zipCode: 10,
  neighborhood: 100,
  
  // Campos de texto médio
  category: 50,
  type: 50,
  status: 30,
  paymentMethod: 50,
  
  // Campos de observações e descrições (mais permissivos)
  notes: 1000,
  description: 2000,
  observations: 1500,
  comments: 1000,
  
  // Campos de URL e links
  url: 2048,
  
  // Campos de senha
  password: 128,
  
  // Campos de data (formato string)
  date: 10,
  datetime: 19,
  
  // Campos específicos do sistema
  driverName: 100,
  expenseType: 100,
  revenueType: 100,
  maintenanceType: 100,
} as const;

// Padrões de validação para diferentes tipos de campos
export const VALIDATION_PATTERNS = {
  // Apenas letras, números, espaços e alguns caracteres especiais básicos
  alphanumericBasic: /^[a-zA-Z0-9\s\-_.()]+$/,
  
  // Letras, números, espaços e acentos (para nomes brasileiros)
  namePattern: /^[a-zA-ZÀ-ÿ0-9\s\-_.()]+$/,
  
  // Placa brasileira (formato antigo e Mercosul)
  platePattern: /^[A-Z]{3}[-]?[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$/,
  
  // CPF
  cpfPattern: /^\d{3}\.?\d{3}\.?\d{3}[-]?\d{2}$/,
  
  // CNPJ
  cnpjPattern: /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}[-]?\d{2}$/,
  
  // Telefone brasileiro
  phonePattern: /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}[-]?\d{4}$/,
  
  // Email
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Apenas números
  numericPattern: /^\d+$/,
  
  // Números com decimais
  decimalPattern: /^\d+([.,]\d{1,2})?$/,
  
  // CEP
  zipCodePattern: /^\d{5}[-]?\d{3}$/,
  
  // URL
  urlPattern: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // Data (DD/MM/YYYY)
  datePattern: /^\d{2}\/\d{2}\/\d{4}$/,
  
  // Texto livre (para observações) - permite mais caracteres mas bloqueia scripts
  freeTextPattern: /^[^<>{}[\]\\|`~]*$/,
} as const;

// Tipos de campo para aplicar validações específicas
export type FieldType = 
  | 'name' | 'title' | 'brand' | 'model'
  | 'plate' | 'phone' | 'email' | 'cpf' | 'cnpj' | 'rg' | 'cnh'
  | 'value' | 'price' | 'mileage' | 'year'
  | 'address' | 'city' | 'state' | 'zipCode' | 'neighborhood'
  | 'category' | 'type' | 'status' | 'paymentMethod'
  | 'notes' | 'description' | 'observations' | 'comments'
  | 'url' | 'password' | 'date' | 'datetime'
  | 'driverName' | 'expenseType' | 'revenueType' | 'maintenanceType'
  | 'freeText' | 'alphanumeric' | 'numeric' | 'decimal';

interface ValidationOptions {
  fieldType: FieldType;
  required?: boolean;
  customMaxLength?: number;
  customPattern?: RegExp;
  allowEmpty?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
  warnings: string[];
}

/**
 * Valida e sanitiza um input baseado no tipo de campo
 */
export function validateSecureInput(
  value: string | null | undefined,
  options: ValidationOptions
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Converter para string e tratar valores nulos/undefined
  const stringValue = value?.toString() || '';
  
  // Verificar se é obrigatório
  if (options.required && (!stringValue || stringValue.trim().length === 0)) {
    errors.push('Campo obrigatório');
    return {
      isValid: false,
      sanitizedValue: '',
      errors,
      warnings
    };
  }
  
  // Se campo vazio e não obrigatório, retornar válido
  if (!stringValue.trim() && options.allowEmpty !== false) {
    return {
      isValid: true,
      sanitizedValue: '',
      errors: [],
      warnings: []
    };
  }
  
  // Verificar código malicioso ANTES da sanitização
  if (containsMaliciousCode(stringValue)) {
    errors.push('Código malicioso detectado');
    warnings.push('Conteúdo foi sanitizado por segurança');
  }
  
  // Sanitizar o valor
  let sanitizedValue = sanitizeString(stringValue);
  
  // Obter limite de caracteres
  const maxLength = options.customMaxLength || INPUT_LIMITS[options.fieldType as keyof typeof INPUT_LIMITS] || 255;
  
  // Verificar comprimento máximo
  if (sanitizedValue.length > maxLength) {
    errors.push(`Máximo de ${maxLength} caracteres permitidos`);
    // Truncar o valor se exceder o limite
    sanitizedValue = sanitizedValue.substring(0, maxLength);
    warnings.push(`Texto foi truncado para ${maxLength} caracteres`);
  }
  
  // Aplicar validação de padrão baseada no tipo de campo
  const pattern = options.customPattern || getPatternForFieldType(options.fieldType);
  if (pattern && sanitizedValue && !pattern.test(sanitizedValue)) {
    errors.push(getPatternErrorMessage(options.fieldType));
  }
  
  // Validações específicas por tipo de campo
  const specificValidation = validateSpecificFieldType(sanitizedValue, options.fieldType);
  errors.push(...specificValidation.errors);
  warnings.push(...specificValidation.warnings);
  
  return {
    isValid: errors.length === 0,
    sanitizedValue,
    errors,
    warnings
  };
}

/**
 * Obtém o padrão de validação para um tipo de campo
 */
function getPatternForFieldType(fieldType: FieldType): RegExp | null {
  const patternMap: Partial<Record<FieldType, RegExp>> = {
    name: VALIDATION_PATTERNS.namePattern,
    driverName: VALIDATION_PATTERNS.namePattern,
    title: VALIDATION_PATTERNS.namePattern,
    brand: VALIDATION_PATTERNS.alphanumericBasic,
    model: VALIDATION_PATTERNS.alphanumericBasic,
    plate: VALIDATION_PATTERNS.platePattern,
    phone: VALIDATION_PATTERNS.phonePattern,
    email: VALIDATION_PATTERNS.emailPattern,
    cpf: VALIDATION_PATTERNS.cpfPattern,
    cnpj: VALIDATION_PATTERNS.cnpjPattern,
    zipCode: VALIDATION_PATTERNS.zipCodePattern,
    url: VALIDATION_PATTERNS.urlPattern,
    date: VALIDATION_PATTERNS.datePattern,
    numeric: VALIDATION_PATTERNS.numericPattern,
    decimal: VALIDATION_PATTERNS.decimalPattern,
    value: VALIDATION_PATTERNS.decimalPattern,
    price: VALIDATION_PATTERNS.decimalPattern,
    mileage: VALIDATION_PATTERNS.numericPattern,
    year: VALIDATION_PATTERNS.numericPattern,
    alphanumeric: VALIDATION_PATTERNS.alphanumericBasic,
    freeText: VALIDATION_PATTERNS.freeTextPattern,
    notes: VALIDATION_PATTERNS.freeTextPattern,
    description: VALIDATION_PATTERNS.freeTextPattern,
    observations: VALIDATION_PATTERNS.freeTextPattern,
    comments: VALIDATION_PATTERNS.freeTextPattern,
  };
  
  return patternMap[fieldType] || null;
}

/**
 * Obtém mensagem de erro para padrão de validação
 */
function getPatternErrorMessage(fieldType: FieldType): string {
  const messageMap: Partial<Record<FieldType, string>> = {
    name: 'Nome deve conter apenas letras, números e caracteres básicos',
    plate: 'Formato de placa inválido (ex: ABC-1234 ou ABC1D23)',
    phone: 'Formato de telefone inválido',
    email: 'Formato de email inválido',
    cpf: 'Formato de CPF inválido',
    cnpj: 'Formato de CNPJ inválido',
    zipCode: 'Formato de CEP inválido',
    url: 'Formato de URL inválido',
    date: 'Formato de data inválido (DD/MM/YYYY)',
    numeric: 'Deve conter apenas números',
    decimal: 'Formato numérico inválido',
    freeText: 'Contém caracteres não permitidos',
  };
  
  return messageMap[fieldType] || 'Formato inválido';
}

/**
 * Validações específicas por tipo de campo
 */
function validateSpecificFieldType(value: string, fieldType: FieldType): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!value) return { errors, warnings };
  
  switch (fieldType) {
    case 'year':
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 1) {
        errors.push(`Ano deve estar entre 1900 e ${currentYear + 1}`);
      }
      break;
      
    case 'mileage':
      const mileage = parseInt(value);
      if (mileage < 0) {
        errors.push('Quilometragem não pode ser negativa');
      }
      if (mileage > 9999999) {
        errors.push('Quilometragem muito alta');
      }
      break;
      
    case 'value':
    case 'price':
      const numValue = parseFloat(value.replace(',', '.'));
      if (numValue < 0) {
        errors.push('Valor não pode ser negativo');
      }
      if (numValue > 99999999) {
        errors.push('Valor muito alto');
      }
      break;
      
    case 'email':
      if (value.length > 254) {
        errors.push('Email muito longo');
      }
      break;
      
    case 'password':
      if (value.length < 6) {
        errors.push('Senha deve ter pelo menos 6 caracteres');
      }
      break;
  }
  
  return { errors, warnings };
}

/**
 * Valida um objeto completo de formulário
 */
export function validateSecureForm<T extends Record<string, any>>(
  formData: T,
  fieldTypes: Partial<Record<keyof T, FieldType>>,
  requiredFields: (keyof T)[] = []
): {
  isValid: boolean;
  sanitizedData: T;
  fieldErrors: Partial<Record<keyof T, string[]>>;
  fieldWarnings: Partial<Record<keyof T, string[]>>;
  globalErrors: string[];
} {
  const sanitizedData = {} as T;
  const fieldErrors: Partial<Record<keyof T, string[]>> = {};
  const fieldWarnings: Partial<Record<keyof T, string[]>> = {};
  const globalErrors: string[] = [];
  
  let isValid = true;
  
  // Validar cada campo
  for (const [key, value] of Object.entries(formData)) {
    const fieldType = fieldTypes[key as keyof T];
    
    if (fieldType) {
      const validation = validateSecureInput(value, {
        fieldType,
        required: requiredFields.includes(key as keyof T),
        allowEmpty: true
      });
      
      sanitizedData[key as keyof T] = validation.sanitizedValue as T[keyof T];
      
      if (validation.errors.length > 0) {
        fieldErrors[key as keyof T] = validation.errors;
        isValid = false;
      }
      
      if (validation.warnings.length > 0) {
        fieldWarnings[key as keyof T] = validation.warnings;
      }
    } else {
      // Se não há tipo definido, apenas sanitizar
      sanitizedData[key as keyof T] = sanitizeString(value?.toString() || '') as T[keyof T];
    }
  }
  
  return {
    isValid,
    sanitizedData,
    fieldErrors,
    fieldWarnings,
    globalErrors
  };
}

/**
 * Hook React para validação de input em tempo real
 */
export function createSecureInputValidator(fieldType: FieldType, options: Partial<ValidationOptions> = {}) {
  return (value: string) => {
    return validateSecureInput(value, {
      fieldType,
      ...options
    });
  };
}

/**
 * Utilitário para obter configurações de input baseadas no tipo
 */
export function getInputConfig(fieldType: FieldType) {
  return {
    maxLength: INPUT_LIMITS[fieldType as keyof typeof INPUT_LIMITS] || 255,
    pattern: getPatternForFieldType(fieldType),
    placeholder: getPlaceholderForFieldType(fieldType),
    type: getInputTypeForFieldType(fieldType)
  };
}

/**
 * Obtém placeholder sugerido para um tipo de campo
 */
function getPlaceholderForFieldType(fieldType: FieldType): string {
  const placeholderMap: Partial<Record<FieldType, string>> = {
    name: 'Ex: Honda Civic 2020',
    plate: 'Ex: ABC-1234',
    phone: 'Ex: (11) 99999-9999',
    email: 'Ex: usuario@email.com',
    cpf: 'Ex: 123.456.789-00',
    cnpj: 'Ex: 12.345.678/0001-90',
    zipCode: 'Ex: 12345-678',
    value: 'Ex: 50000,00',
    price: 'Ex: 1500,00',
    mileage: 'Ex: 50000',
    year: 'Ex: 2020',
    date: 'Ex: 01/01/2024',
    url: 'Ex: https://exemplo.com',
  };
  
  return placeholderMap[fieldType] || '';
}

/**
 * Obtém tipo de input HTML para um tipo de campo
 */
function getInputTypeForFieldType(fieldType: FieldType): string {
  const typeMap: Partial<Record<FieldType, string>> = {
    email: 'email',
    password: 'password',
    phone: 'tel',
    url: 'url',
    date: 'date',
    numeric: 'number',
    decimal: 'number',
    value: 'number',
    price: 'number',
    mileage: 'number',
    year: 'number',
  };
  
  return typeMap[fieldType] || 'text';
}