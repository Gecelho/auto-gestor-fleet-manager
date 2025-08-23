-- Remover políticas existentes que podem ser menos seguras
DROP POLICY IF EXISTS "Users can only access their own data when subscription active" ON users;
DROP POLICY IF EXISTS "Users can only access vehicles when subscription active" ON vehicles;
DROP POLICY IF EXISTS "Users can only access expenses when subscription active" ON expenses;
DROP POLICY IF EXISTS "Users can only access revenues when subscription active" ON revenues;

-- Função mais segura para verificar assinatura ativa
CREATE OR REPLACE FUNCTION is_subscription_active_secure(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
    current_time TIMESTAMPTZ := NOW();
BEGIN
    -- Buscar dados do usuário com lock para evitar race conditions
    SELECT subscription_status, subscription_expires_at 
    INTO user_record 
    FROM users 
    WHERE id = user_id
    FOR UPDATE;
    
    -- Se não encontrou o usuário, retorna false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Se status é suspended ou expired, sempre retorna false
    IF user_record.subscription_status IN ('suspended', 'expired') THEN
        RETURN FALSE;
    END IF;
    
    -- Se não tem data de expiração, considera inativo por segurança
    IF user_record.subscription_expires_at IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verifica se a data de expiração já passou
    IF user_record.subscription_expires_at <= current_time THEN
        -- Atualiza automaticamente para expired se necessário
        UPDATE users 
        SET subscription_status = 'expired', updated_at = current_time
        WHERE id = user_id AND subscription_status != 'expired';
        
        RETURN FALSE;
    END IF;
    
    -- Se chegou até aqui, a assinatura está ativa
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário atual pode acessar dados
CREATE OR REPLACE FUNCTION can_access_data()
RETURNS BOOLEAN AS $$
BEGIN
    -- Verifica se há um usuário autenticado
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verifica se a assinatura está ativa
    RETURN is_subscription_active_secure(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS mais seguras para users
DROP POLICY IF EXISTS "Users can only read their own data when subscription active" ON users;
CREATE POLICY "Users can only read their own data when subscription active" ON users
    FOR SELECT USING (
        auth.uid() = id AND 
        can_access_data()
    );

DROP POLICY IF EXISTS "Users can only update their own data when subscription active" ON users;
CREATE POLICY "Users can only update their own data when subscription active" ON users
    FOR UPDATE USING (
        auth.uid() = id AND 
        can_access_data()
    ) WITH CHECK (
        auth.uid() = id AND 
        can_access_data() AND
        -- Impede alteração dos campos de assinatura via UPDATE normal
        (OLD.subscription_status = NEW.subscription_status) AND
        (OLD.subscription_plan = NEW.subscription_plan) AND
        (OLD.subscription_expires_at = NEW.subscription_expires_at)
    );

-- Políticas RLS para cars (carros)
DROP POLICY IF EXISTS "Users can only access their cars when subscription active" ON cars;
CREATE POLICY "Users can only access their cars when subscription active" ON cars
    FOR ALL USING (
        auth.uid() = user_id AND 
        can_access_data()
    ) WITH CHECK (
        auth.uid() = user_id AND 
        can_access_data()
    );

-- Políticas RLS para expenses
DROP POLICY IF EXISTS "Users can only access their expenses when subscription active" ON expenses;
CREATE POLICY "Users can only access their expenses when subscription active" ON expenses
    FOR ALL USING (
        auth.uid() = user_id AND 
        can_access_data()
    ) WITH CHECK (
        auth.uid() = user_id AND 
        can_access_data()
    );

-- Políticas RLS para revenues
DROP POLICY IF EXISTS "Users can only access their revenues when subscription active" ON revenues;
CREATE POLICY "Users can only access their revenues when subscription active" ON revenues
    FOR ALL USING (
        auth.uid() = user_id AND 
        can_access_data()
    ) WITH CHECK (
        auth.uid() = user_id AND 
        can_access_data()
    );

-- Políticas RLS para drivers
DROP POLICY IF EXISTS "Users can only access their drivers when subscription active" ON drivers;
CREATE POLICY "Users can only access their drivers when subscription active" ON drivers
    FOR ALL USING (
        auth.uid() = owner_id AND 
        can_access_data()
    ) WITH CHECK (
        auth.uid() = owner_id AND 
        can_access_data()
    );

-- Função administrativa para atualizar assinaturas (apenas para admins)
CREATE OR REPLACE FUNCTION admin_update_subscription(
    target_user_id UUID,
    new_status TEXT,
    new_plan TEXT,
    new_expires_at TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Esta função deve ser chamada apenas por funções do servidor
    -- ou por usuários com role específico (implementar conforme necessário)
    
    UPDATE users 
    SET 
        subscription_status = new_status,
        subscription_plan = new_plan,
        subscription_expires_at = new_expires_at,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para impedir alterações diretas nos campos de assinatura
CREATE OR REPLACE FUNCTION prevent_subscription_tampering()
RETURNS TRIGGER AS $$
BEGIN
    -- Permite alterações apenas se vier de funções específicas
    -- ou se os campos de assinatura não foram alterados
    IF (OLD.subscription_status != NEW.subscription_status OR
        OLD.subscription_plan != NEW.subscription_plan OR
        OLD.subscription_expires_at != NEW.subscription_expires_at) THEN
        
        -- Verifica se a alteração está sendo feita por uma função autorizada
        -- (implementar lógica adicional conforme necessário)
        IF current_setting('app.bypass_subscription_check', true) != 'true' THEN
            RAISE EXCEPTION 'Alterações nos campos de assinatura não são permitidas diretamente';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_subscription_tampering_trigger ON users;
CREATE TRIGGER prevent_subscription_tampering_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_subscription_tampering();

-- Função para atualizar assinaturas expiradas (executada periodicamente)
CREATE OR REPLACE FUNCTION update_expired_subscriptions_secure()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Define configuração para permitir alteração dos campos de assinatura
    PERFORM set_config('app.bypass_subscription_check', 'true', true);
    
    UPDATE users 
    SET subscription_status = 'expired', updated_at = NOW()
    WHERE subscription_expires_at <= NOW() 
    AND subscription_status IN ('active', 'trial');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Remove a configuração
    PERFORM set_config('app.bypass_subscription_check', 'false', true);
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON FUNCTION is_subscription_active_secure(UUID) IS 'Verifica de forma segura se a assinatura do usuário está ativa, com proteções contra race conditions';
COMMENT ON FUNCTION can_access_data() IS 'Verifica se o usuário atual pode acessar dados baseado na autenticação e assinatura ativa';
COMMENT ON FUNCTION admin_update_subscription(UUID, TEXT, TEXT, TIMESTAMPTZ) IS 'Função administrativa para atualizar assinaturas de usuários';
COMMENT ON FUNCTION update_expired_subscriptions_secure() IS 'Atualiza assinaturas expiradas de forma segura, retornando o número de registros atualizados';