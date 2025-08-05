-- SQL CORRIGIDO para criar funcionalidade de despesas futuras
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar coluna 'paid' na tabela expenses para marcar se foi paga
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false;

-- 2. Criar tabela para controlar despesas futuras baseadas em quilometragem
CREATE TABLE IF NOT EXISTS future_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  target_mileage NUMERIC(10,0) NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(expense_id)
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_future_expenses_car_id ON future_expenses (car_id);
CREATE INDEX IF NOT EXISTS idx_future_expenses_target_mileage ON future_expenses (target_mileage);
CREATE INDEX IF NOT EXISTS idx_future_expenses_completed ON future_expenses (is_completed);

-- 4. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Criar trigger para atualizar updated_at na tabela future_expenses
DROP TRIGGER IF EXISTS update_future_expenses_updated_at ON future_expenses;
CREATE TRIGGER update_future_expenses_updated_at 
    BEFORE UPDATE ON future_expenses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Criar view para facilitar consultas de despesas futuras
DROP VIEW IF EXISTS future_expenses_view;
CREATE VIEW future_expenses_view AS
SELECT 
    fe.id as future_expense_id,
    fe.car_id,
    fe.target_mileage,
    fe.is_completed,
    fe.created_at as future_created_at,
    fe.updated_at as future_updated_at,
    e.id as expense_id,
    e.description,
    e.value,
    e.date as expense_date,
    e.observation,
    e.mileage as expense_mileage,
    e.next_mileage,
    e.paid,
    c.mileage as current_car_mileage,
    c.name as car_model,
    c.name as car_brand,
    c.plate as car_plate,
    (fe.target_mileage - c.mileage) as km_remaining,
    CASE 
        WHEN (fe.target_mileage - c.mileage) <= 1000 AND (fe.target_mileage - c.mileage) > 0 THEN true
        ELSE false
    END as is_near
FROM future_expenses fe
JOIN expenses e ON fe.expense_id = e.id
JOIN cars c ON fe.car_id = c.id
ORDER BY 
    fe.is_completed ASC,
    (fe.target_mileage - c.mileage) ASC;

-- 7. Função para criar automaticamente future_expenses quando uma despesa tem next_mileage
CREATE OR REPLACE FUNCTION create_future_expense_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.next_mileage IS NOT NULL AND NEW.next_mileage > 0 THEN
        INSERT INTO future_expenses (car_id, expense_id, target_mileage)
        VALUES (NEW.car_id, NEW.id, NEW.next_mileage)
        ON CONFLICT (expense_id) DO UPDATE SET
            target_mileage = NEW.next_mileage,
            updated_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Criar triggers para criar future_expenses automaticamente
DROP TRIGGER IF EXISTS create_future_expense_on_insert ON expenses;
CREATE TRIGGER create_future_expense_on_insert
    AFTER INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION create_future_expense_trigger();

DROP TRIGGER IF EXISTS create_future_expense_on_update ON expenses;
CREATE TRIGGER create_future_expense_on_update
    AFTER UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION create_future_expense_trigger();

-- 9. Função RPC para buscar próxima despesa de cada carro
CREATE OR REPLACE FUNCTION get_next_expense_per_car()
RETURNS TABLE (
    future_expense_id UUID,
    car_id UUID,
    target_mileage NUMERIC,
    is_completed BOOLEAN,
    future_created_at TIMESTAMP WITH TIME ZONE,
    future_updated_at TIMESTAMP WITH TIME ZONE,
    expense_id UUID,
    description TEXT,
    value NUMERIC,
    expense_date DATE,
    observation TEXT,
    expense_mileage NUMERIC,
    next_mileage NUMERIC,
    paid BOOLEAN,
    current_car_mileage NUMERIC,
    car_model TEXT,
    car_brand TEXT,
    car_plate TEXT,
    km_remaining NUMERIC,
    is_near BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (fev.car_id) 
        fev.future_expense_id,
        fev.car_id,
        fev.target_mileage,
        fev.is_completed,
        fev.future_created_at,
        fev.future_updated_at,
        fev.expense_id,
        fev.description,
        fev.value,
        fev.expense_date,
        fev.observation,
        fev.expense_mileage,
        fev.next_mileage,
        fev.paid,
        fev.current_car_mileage,
        fev.car_model,
        fev.car_brand,
        fev.car_plate,
        fev.km_remaining,
        fev.is_near
    FROM future_expenses_view fev
    WHERE fev.is_completed = false
    ORDER BY fev.car_id, fev.km_remaining ASC;
END;
$$ LANGUAGE plpgsql;

-- 10. Migrar dados existentes (despesas que já têm next_mileage)
INSERT INTO future_expenses (car_id, expense_id, target_mileage)
SELECT 
    e.car_id,
    e.id,
    e.next_mileage
FROM expenses e
WHERE e.next_mileage IS NOT NULL 
AND e.next_mileage > 0
ON CONFLICT (expense_id) DO NOTHING;

-- Comentários:
-- - future_expenses: controla quando cada despesa deve ser feita novamente
-- - target_mileage: KM em que a despesa deve ser realizada
-- - is_completed: se a despesa foi marcada como realizada
-- - paid: se a despesa foi paga (na tabela expenses)
-- - future_expenses_view: view que facilita consultas com todos os dados necessários