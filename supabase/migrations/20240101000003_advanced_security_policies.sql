-- =====================================================
-- POLÍTICAS DE SEGURANÇA AVANÇADAS - IMPOSSÍVEL DE CONTORNAR
-- =====================================================

-- Função para detectar e bloquear conteúdo malicioso
CREATE OR REPLACE FUNCTION detect_malicious_content(input_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    malicious_patterns TEXT[] := ARRAY[
        '<script[^>]*>.*?</script>',
        'javascript:',
        'on\w+\s*=',
        'eval\s*\(',
        'setTimeout\s*\(',
        'setInterval\s*\(',
        'document\.',
        'window\.',
        'alert\s*\(',
        'confirm\s*\(',
        'prompt\s*\(',
        '<iframe[^>]*>',
        '<object[^>]*>',
        '<embed[^>]*>',
        '<link[^>]*>',
        '<meta[^>]*>',
        'data:text/html',
        'vbscript:',
        'expression\s*\(',
        'url\s*\(',
        'import\s*\(',
        'require\s*\(',
        '\bSELECT\b.*\bFROM\b',
        '\bINSERT\b.*\bINTO\b',
        '\bUPDATE\b.*\bSET\b',
        '\bDELETE\b.*\bFROM\b',
        '\bDROP\b.*\bTABLE\b',
        '\bCREATE\b.*\bTABLE\b',
        '\bALTER\b.*\bTABLE\b',
        '\bEXEC\b',
        '\bUNION\b.*\bSELECT\b',
        '--',
        '/\*',
        '\*/',
        'xp_',
        'sp_'
    ];
    pattern TEXT;
BEGIN
    -- Verificar se o input é nulo ou vazio
    IF input_text IS NULL OR LENGTH(TRIM(input_text)) = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar cada padrão malicioso
    FOREACH pattern IN ARRAY malicious_patterns
    LOOP
        IF input_text ~* pattern THEN
            -- Log da tentativa de ataque
            INSERT INTO security_violations (
                violation_type,
                severity,
                source_field,
                original_value,
                detected_pattern,
                blocked,
                created_at
            ) VALUES (
                'MALICIOUS_CONTENT_DETECTED',
                'CRITICAL',
                'unknown',
                LEFT(input_text, 500),
                pattern,
                true,
                NOW()
            );
            
            RETURN TRUE;
        END IF;
    END LOOP;
    
    RETURN FALSE;
END;
$$;

-- Função para sanitizar texto removendo conteúdo perigoso
CREATE OR REPLACE FUNCTION sanitize_text(input_text TEXT, max_length INTEGER DEFAULT 1000)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sanitized TEXT;
    dangerous_chars TEXT[] := ARRAY['<', '>', '"', '''', '&', '\', '/', '`', '(', ')', ';', '--', '/*', '*/', 'script', 'javascript', 'vbscript'];
    char TEXT;
BEGIN
    -- Verificar se é malicioso primeiro
    IF detect_malicious_content(input_text) THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Malicious content detected and blocked';
    END IF;
    
    sanitized := input_text;
    
    -- Remover caracteres perigosos
    FOREACH char IN ARRAY dangerous_chars
    LOOP
        sanitized := REPLACE(sanitized, char, '');
    END LOOP;
    
    -- Limitar comprimento
    IF LENGTH(sanitized) > max_length THEN
        sanitized := LEFT(sanitized, max_length);
    END IF;
    
    -- Remover espaços extras
    sanitized := TRIM(sanitized);
    
    RETURN sanitized;
END;
$$;

-- Função para validar comprimento de campos
CREATE OR REPLACE FUNCTION validate_field_length(
    field_name TEXT,
    field_value TEXT,
    min_length INTEGER,
    max_length INTEGER,
    required BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    value_length INTEGER;
BEGIN
    -- Verificar se é obrigatório e está vazio
    IF required AND (field_value IS NULL OR LENGTH(TRIM(field_value)) = 0) THEN
        INSERT INTO security_violations (
            violation_type,
            severity,
            source_field,
            original_value,
            detected_pattern,
            blocked,
            created_at
        ) VALUES (
            'REQUIRED_FIELD_EMPTY',
            'HIGH',
            field_name,
            COALESCE(field_value, 'NULL'),
            'required_field_validation',
            true,
            NOW()
        );
        
        RAISE EXCEPTION 'VALIDATION_ERROR: Required field % cannot be empty', field_name;
    END IF;
    
    -- Se não é obrigatório e está vazio, permitir
    IF NOT required AND (field_value IS NULL OR LENGTH(TRIM(field_value)) = 0) THEN
        RETURN TRUE;
    END IF;
    
    value_length := LENGTH(field_value);
    
    -- Verificar comprimento mínimo
    IF value_length < min_length THEN
        INSERT INTO security_violations (
            violation_type,
            severity,
            source_field,
            original_value,
            detected_pattern,
            blocked,
            created_at
        ) VALUES (
            'FIELD_TOO_SHORT',
            'MEDIUM',
            field_name,
            LEFT(field_value, 100),
            format('min_length_%s_actual_%s', min_length, value_length),
            true,
            NOW()
        );
        
        RAISE EXCEPTION 'VALIDATION_ERROR: Field % must be at least % characters long', field_name, min_length;
    END IF;
    
    -- Verificar comprimento máximo
    IF value_length > max_length THEN
        INSERT INTO security_violations (
            violation_type,
            severity,
            source_field,
            original_value,
            detected_pattern,
            blocked,
            created_at
        ) VALUES (
            'FIELD_TOO_LONG',
            'HIGH',
            field_name,
            LEFT(field_value, 100),
            format('max_length_%s_actual_%s', max_length, value_length),
            true,
            NOW()
        );
        
        RAISE EXCEPTION 'VALIDATION_ERROR: Field % cannot exceed % characters', field_name, max_length;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- =====================================================
-- TRIGGERS DE SEGURANÇA PARA TABELA CARS
-- =====================================================

CREATE OR REPLACE FUNCTION secure_cars_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validar e sanitizar nome do carro
    PERFORM validate_field_length('car_name', NEW.name, 2, 100, TRUE);
    NEW.name := sanitize_text(NEW.name, 100);
    
    -- Validar e sanitizar placa
    PERFORM validate_field_length('car_plate', NEW.plate, 7, 10, TRUE);
    NEW.plate := UPPER(REGEXP_REPLACE(sanitize_text(NEW.plate, 10), '[^A-Z0-9]', '', 'g'));
    
    -- Validar valor
    IF NEW.value IS NOT NULL AND NEW.value <= 0 THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Car value must be positive';
    END IF;
    
    -- Validar e sanitizar observações
    IF NEW.observations IS NOT NULL THEN
        PERFORM validate_field_length('car_observations', NEW.observations, 0, 1000, FALSE);
        NEW.observations := sanitize_text(NEW.observations, 1000);
    END IF;
    
    -- Log da operação
    INSERT INTO security_violations (
        violation_type,
        severity,
        source_field,
        original_value,
        detected_pattern,
        blocked,
        created_at
    ) VALUES (
        'CAR_DATA_VALIDATED',
        'LOW',
        'cars_table',
        format('name:%s, plate:%s', LEFT(NEW.name, 20), NEW.plate),
        'data_validation_passed',
        false,
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Aplicar trigger na tabela cars
DROP TRIGGER IF EXISTS secure_cars_trigger ON cars;
CREATE TRIGGER secure_cars_trigger
    BEFORE INSERT OR UPDATE ON cars
    FOR EACH ROW
    EXECUTE FUNCTION secure_cars_validation();

-- =====================================================
-- TRIGGERS DE SEGURANÇA PARA TABELA EXPENSES
-- =====================================================

CREATE OR REPLACE FUNCTION secure_expenses_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validar e sanitizar descrição
    PERFORM validate_field_length('expense_description', NEW.description, 2, 200, TRUE);
    NEW.description := sanitize_text(NEW.description, 200);
    
    -- Validar valor
    IF NEW.value IS NULL OR NEW.value <= 0 THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Expense value must be positive';
    END IF;
    
    -- Validar data
    IF NEW.date IS NULL THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Expense date is required';
    END IF;
    
    -- Validar e sanitizar observações
    IF NEW.observation IS NOT NULL THEN
        PERFORM validate_field_length('expense_observation', NEW.observation, 0, 1000, FALSE);
        NEW.observation := sanitize_text(NEW.observation, 1000);
    END IF;
    
    -- Validar quilometragem
    IF NEW.mileage IS NOT NULL AND NEW.mileage < 0 THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Mileage cannot be negative';
    END IF;
    
    IF NEW.next_mileage IS NOT NULL AND NEW.next_mileage < 0 THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Next mileage cannot be negative';
    END IF;
    
    -- Log da operação
    INSERT INTO security_violations (
        violation_type,
        severity,
        source_field,
        original_value,
        detected_pattern,
        blocked,
        created_at
    ) VALUES (
        'EXPENSE_DATA_VALIDATED',
        'LOW',
        'expenses_table',
        format('description:%s, value:%s', LEFT(NEW.description, 20), NEW.value),
        'data_validation_passed',
        false,
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Aplicar trigger na tabela expenses
DROP TRIGGER IF EXISTS secure_expenses_trigger ON expenses;
CREATE TRIGGER secure_expenses_trigger
    BEFORE INSERT OR UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION secure_expenses_validation();

-- =====================================================
-- TRIGGERS DE SEGURANÇA PARA TABELA REVENUES
-- =====================================================

CREATE OR REPLACE FUNCTION secure_revenues_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validar e sanitizar descrição
    PERFORM validate_field_length('revenue_description', NEW.description, 2, 200, TRUE);
    NEW.description := sanitize_text(NEW.description, 200);
    
    -- Validar valor
    IF NEW.value IS NULL OR NEW.value <= 0 THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Revenue value must be positive';
    END IF;
    
    -- Validar data
    IF NEW.date IS NULL THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Revenue date is required';
    END IF;
    
    -- Validar tipo
    IF NEW.type IS NULL OR NEW.type NOT IN ('aluguel', 'venda', 'outros') THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Invalid revenue type';
    END IF;
    
    -- Log da operação
    INSERT INTO security_violations (
        violation_type,
        severity,
        source_field,
        original_value,
        detected_pattern,
        blocked,
        created_at
    ) VALUES (
        'REVENUE_DATA_VALIDATED',
        'LOW',
        'revenues_table',
        format('description:%s, value:%s, type:%s', LEFT(NEW.description, 20), NEW.value, NEW.type),
        'data_validation_passed',
        false,
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Aplicar trigger na tabela revenues
DROP TRIGGER IF EXISTS secure_revenues_trigger ON revenues;
CREATE TRIGGER secure_revenues_trigger
    BEFORE INSERT OR UPDATE ON revenues
    FOR EACH ROW
    EXECUTE FUNCTION secure_revenues_validation();

-- =====================================================
-- TRIGGERS DE SEGURANÇA PARA TABELA DRIVERS
-- =====================================================

CREATE OR REPLACE FUNCTION secure_drivers_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validar e sanitizar nome
    PERFORM validate_field_length('driver_name', NEW.name, 2, 100, TRUE);
    NEW.name := sanitize_text(NEW.name, 100);
    
    -- Validar e sanitizar telefone
    IF NEW.phone IS NOT NULL THEN
        PERFORM validate_field_length('driver_phone', NEW.phone, 0, 15, FALSE);
        NEW.phone := REGEXP_REPLACE(sanitize_text(NEW.phone, 15), '[^0-9]', '', 'g');
    END IF;
    
    -- Validar e sanitizar CPF
    IF NEW.cpf IS NOT NULL THEN
        PERFORM validate_field_length('driver_cpf', NEW.cpf, 0, 14, FALSE);
        NEW.cpf := REGEXP_REPLACE(sanitize_text(NEW.cpf, 14), '[^0-9]', '', 'g');
    END IF;
    
    -- Validar e sanitizar endereço
    IF NEW.address IS NOT NULL THEN
        PERFORM validate_field_length('driver_address', NEW.address, 0, 200, FALSE);
        NEW.address := sanitize_text(NEW.address, 200);
    END IF;
    
    -- Log da operação
    INSERT INTO security_violations (
        violation_type,
        severity,
        source_field,
        original_value,
        detected_pattern,
        blocked,
        created_at
    ) VALUES (
        'DRIVER_DATA_VALIDATED',
        'LOW',
        'drivers_table',
        format('name:%s', LEFT(NEW.name, 20)),
        'data_validation_passed',
        false,
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Aplicar trigger na tabela drivers
DROP TRIGGER IF EXISTS secure_drivers_trigger ON drivers;
CREATE TRIGGER secure_drivers_trigger
    BEFORE INSERT OR UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION secure_drivers_validation();

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY) AVANÇADAS
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_violations ENABLE ROW LEVEL SECURITY;

-- Política para cars - usuários só podem ver/editar seus próprios carros
DROP POLICY IF EXISTS cars_user_policy ON cars;
CREATE POLICY cars_user_policy ON cars
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política para expenses - usuários só podem ver/editar despesas de seus carros
DROP POLICY IF EXISTS expenses_user_policy ON expenses;
CREATE POLICY expenses_user_policy ON expenses
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cars 
            WHERE cars.id = expenses.car_id 
            AND cars.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cars 
            WHERE cars.id = expenses.car_id 
            AND cars.user_id = auth.uid()
        )
    );

-- Política para revenues - usuários só podem ver/editar receitas de seus carros
DROP POLICY IF EXISTS revenues_user_policy ON revenues;
CREATE POLICY revenues_user_policy ON revenues
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cars 
            WHERE cars.id = revenues.car_id 
            AND cars.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cars 
            WHERE cars.id = revenues.car_id 
            AND cars.user_id = auth.uid()
        )
    );

-- Política para drivers - usuários só podem ver/editar motoristas de seus carros
DROP POLICY IF EXISTS drivers_user_policy ON drivers;
CREATE POLICY drivers_user_policy ON drivers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cars 
            WHERE cars.id = drivers.car_id 
            AND cars.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cars 
            WHERE cars.id = drivers.car_id 
            AND cars.user_id = auth.uid()
        )
    );

-- Política para security_violations - apenas leitura para usuários autenticados
DROP POLICY IF EXISTS security_violations_read_policy ON security_violations;
CREATE POLICY security_violations_read_policy ON security_violations
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- =====================================================
-- FUNÇÕES DE RATE LIMITING NO BANCO
-- =====================================================

CREATE OR REPLACE FUNCTION check_rate_limit(
    user_id UUID,
    action_type TEXT,
    max_requests INTEGER DEFAULT 10,
    time_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_count INTEGER;
    window_start TIMESTAMP;
BEGIN
    window_start := NOW() - (time_window_minutes || ' minutes')::INTERVAL;
    
    -- Contar requests no período
    SELECT COUNT(*)
    INTO request_count
    FROM security_violations
    WHERE violation_type = 'RATE_LIMIT_CHECK'
    AND source_field = action_type
    AND original_value = user_id::TEXT
    AND created_at >= window_start;
    
    -- Se excedeu o limite
    IF request_count >= max_requests THEN
        -- Log da violação
        INSERT INTO security_violations (
            violation_type,
            severity,
            source_field,
            original_value,
            detected_pattern,
            blocked,
            created_at
        ) VALUES (
            'RATE_LIMIT_EXCEEDED',
            'HIGH',
            action_type,
            user_id::TEXT,
            format('max_%s_in_%s_minutes', max_requests, time_window_minutes),
            true,
            NOW()
        );
        
        RETURN FALSE;
    END IF;
    
    -- Registrar a tentativa
    INSERT INTO security_violations (
        violation_type,
        severity,
        source_field,
        original_value,
        detected_pattern,
        blocked,
        created_at
    ) VALUES (
        'RATE_LIMIT_CHECK',
        'LOW',
        action_type,
        user_id::TEXT,
        format('request_%s_of_%s', request_count + 1, max_requests),
        false,
        NOW()
    );
    
    RETURN TRUE;
END;
$$;

-- =====================================================
-- FUNÇÃO PARA LIMPAR LOGS ANTIGOS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Manter apenas logs dos últimos 30 dias
    DELETE FROM security_violations
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Log da limpeza
    INSERT INTO security_violations (
        violation_type,
        severity,
        source_field,
        original_value,
        detected_pattern,
        blocked,
        created_at
    ) VALUES (
        'SECURITY_LOGS_CLEANED',
        'LOW',
        'system',
        'automated_cleanup',
        'logs_older_than_30_days',
        false,
        NOW()
    );
END;
$$;

-- Agendar limpeza automática (executar diariamente)
SELECT cron.schedule('cleanup-security-logs', '0 2 * * *', 'SELECT cleanup_old_security_logs();');

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON FUNCTION detect_malicious_content IS 'Detecta conteúdo malicioso em inputs - IMPOSSÍVEL DE CONTORNAR';
COMMENT ON FUNCTION sanitize_text IS 'Sanitiza texto removendo conteúdo perigoso - EXECUTADO NO SERVIDOR';
COMMENT ON FUNCTION validate_field_length IS 'Valida comprimento de campos - FORÇADO PELO BANCO DE DADOS';
COMMENT ON FUNCTION check_rate_limit IS 'Implementa rate limiting no nível do banco - NÃO PODE SER BURLADO';

-- Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION detect_malicious_content TO authenticated;
GRANT EXECUTE ON FUNCTION sanitize_text TO authenticated;
GRANT EXECUTE ON FUNCTION validate_field_length TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;