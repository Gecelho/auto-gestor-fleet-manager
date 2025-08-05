-- SQL para atualizar as colunas no Supabase para suportar números decimais

-- Atualizar tabela cars
-- Alterar purchase_value para suportar decimais (ex: 16000.57)
ALTER TABLE cars ALTER COLUMN purchase_value TYPE NUMERIC(12,2);

-- Alterar mileage para suportar números inteiros maiores (ex: 600000)
ALTER TABLE cars ALTER COLUMN mileage TYPE NUMERIC(10,0);

-- Atualizar tabela expenses
-- Alterar value para suportar decimais (ex: 150.75)
ALTER TABLE expenses ALTER COLUMN value TYPE NUMERIC(10,2);

-- Alterar mileage para suportar números inteiros maiores (ex: 50000)
ALTER TABLE expenses ALTER COLUMN mileage TYPE NUMERIC(10,0);

-- Alterar next_mileage para suportar números inteiros maiores (ex: 55000)
ALTER TABLE expenses ALTER COLUMN next_mileage TYPE NUMERIC(10,0);

-- Atualizar tabela revenues
-- Alterar value para suportar decimais (ex: 1500.50)
ALTER TABLE revenues ALTER COLUMN value TYPE NUMERIC(10,2);

-- Comentários sobre os tipos:
-- NUMERIC(12,2) = até 12 dígitos totais, sendo 2 decimais (ex: 9999999999.99)
-- NUMERIC(10,2) = até 10 dígitos totais, sendo 2 decimais (ex: 99999999.99)
-- NUMERIC(10,0) = até 10 dígitos inteiros (ex: 9999999999)

-- Estes tipos permitem:
-- - Valores monetários com centavos (ex: 16.000,57 = 16000.57)
-- - Quilometragem com pontos de milhares (ex: 600.000 = 600000)
-- - Precisão decimal para cálculos financeiros
-- - Suporte a valores grandes sem perda de precisão