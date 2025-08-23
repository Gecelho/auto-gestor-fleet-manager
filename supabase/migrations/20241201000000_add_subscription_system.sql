-- Adicionar colunas de assinatura na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('active', 'expired', 'trial', 'suspended')),
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise'));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at na tabela users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para verificar se a assinatura está ativa
CREATE OR REPLACE FUNCTION is_subscription_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT subscription_status, subscription_expires_at 
    INTO user_record 
    FROM users 
    WHERE id = user_id;
    
    -- Se não encontrou o usuário, retorna false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Se status é suspended, sempre retorna false
    IF user_record.subscription_status = 'suspended' THEN
        RETURN FALSE;
    END IF;
    
    -- Se status é expired, sempre retorna false
    IF user_record.subscription_status = 'expired' THEN
        RETURN FALSE;
    END IF;
    
    -- Se status é trial ou active, verifica a data de expiração
    IF user_record.subscription_expires_at IS NULL THEN
        -- Se não tem data de expiração definida, considera ativo (para compatibilidade)
        RETURN TRUE;
    END IF;
    
    -- Verifica se a data de expiração já passou
    RETURN user_record.subscription_expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar status de assinatura expirada automaticamente
CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET subscription_status = 'expired'
    WHERE subscription_expires_at < NOW() 
    AND subscription_status IN ('active', 'trial');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política RLS para proteger dados sensíveis quando assinatura expirada
DROP POLICY IF EXISTS "Users can only access their own data when subscription active" ON users;
CREATE POLICY "Users can only access their own data when subscription active" ON users
    FOR SELECT USING (
        auth.uid() = id AND 
        is_subscription_active(auth.uid())
    );

-- Política RLS para carros - só acessa se assinatura ativa
DROP POLICY IF EXISTS "Users can only access cars when subscription active" ON cars;
CREATE POLICY "Users can only access cars when subscription active" ON cars
    FOR ALL USING (
        auth.uid() = user_id AND 
        is_subscription_active(auth.uid())
    );

-- Política RLS para despesas - só acessa se assinatura ativa
DROP POLICY IF EXISTS "Users can only access expenses when subscription active" ON expenses;
CREATE POLICY "Users can only access expenses when subscription active" ON expenses
    FOR ALL USING (
        auth.uid() = user_id AND 
        is_subscription_active(auth.uid())
    );

-- Política RLS para receitas - só acessa se assinatura ativa
DROP POLICY IF EXISTS "Users can only access revenues when subscription active" ON revenues;
CREATE POLICY "Users can only access revenues when subscription active" ON revenues
    FOR ALL USING (
        auth.uid() = user_id AND 
        is_subscription_active(auth.uid())
    );

-- Definir data de expiração padrão para usuários existentes (30 dias trial)
UPDATE users 
SET 
    subscription_expires_at = NOW() + INTERVAL '30 days',
    subscription_status = 'trial'
WHERE subscription_expires_at IS NULL;

-- Comentários para documentação
COMMENT ON COLUMN users.subscription_expires_at IS 'Data de expiração da assinatura do usuário';
COMMENT ON COLUMN users.subscription_status IS 'Status da assinatura: active, expired, trial, suspended';
COMMENT ON COLUMN users.subscription_plan IS 'Plano de assinatura: basic, premium, enterprise';
COMMENT ON FUNCTION is_subscription_active(UUID) IS 'Verifica se a assinatura do usuário está ativa e não expirada';
COMMENT ON FUNCTION update_expired_subscriptions() IS 'Atualiza automaticamente status de assinaturas expiradas';