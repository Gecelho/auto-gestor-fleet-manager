-- Criar tabela de controle de admins
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Habilitar RLS na tabela admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Política para admins poderem ver outros admins
CREATE POLICY "Admins can view admin_users" ON admin_users
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true)
  );

-- Política para admins poderem inserir novos admins
CREATE POLICY "Admins can insert admin_users" ON admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true)
  );

-- Política para admins poderem atualizar outros admins
CREATE POLICY "Admins can update admin_users" ON admin_users
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.is_active = true)
  );

-- Função para verificar se um usuário é admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    -- Verifica se há um usuário autenticado
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verifica se o usuário existe na tabela admin_users e está ativo
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.user_id = is_admin.user_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS em todas as tabelas sensíveis e criar policies para admins
-- Admins têm acesso total aos dados de todos os usuários

-- Política para admins acessarem todos os dados de users
CREATE POLICY "Admins full access to users" ON users
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Política para admins acessarem todos os dados de cars
CREATE POLICY "Admins full access to cars" ON cars
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Política para admins acessarem todos os dados de expenses
CREATE POLICY "Admins full access to expenses" ON expenses
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Política para admins acessarem todos os dados de revenues
CREATE POLICY "Admins full access to revenues" ON revenues
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Política para admins acessarem todos os dados de drivers
CREATE POLICY "Admins full access to drivers" ON drivers
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Função administrativa para adicionar admin (apenas para service_role ou admins existentes)
CREATE OR REPLACE FUNCTION add_admin_user(
    target_email TEXT,
    target_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
    current_user_id UUID := auth.uid();
BEGIN
    -- Se target_user_id não foi fornecido, buscar pelo email
    IF target_user_id IS NULL THEN
        SELECT id INTO target_user_id 
        FROM auth.users 
        WHERE email = target_email;
        
        IF target_user_id IS NULL THEN
            RAISE EXCEPTION 'Usuário com email % não encontrado', target_email;
        END IF;
    END IF;
    
    -- Verificar se o usuário já é admin
    IF is_admin(target_user_id) THEN
        RAISE EXCEPTION 'Usuário já é administrador';
    END IF;
    
    -- Verificar se quem está executando é admin (ou se é uma operação do sistema)
    IF current_user_id IS NOT NULL AND NOT is_admin(current_user_id) THEN
        RAISE EXCEPTION 'Apenas administradores podem adicionar novos admins';
    END IF;
    
    -- Inserir o novo admin
    INSERT INTO admin_users (user_id, email, created_by)
    VALUES (target_user_id, target_email, current_user_id);
    
    RETURN TRUE;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Usuário já é administrador';
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover admin
CREATE OR REPLACE FUNCTION remove_admin_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID := auth.uid();
    admin_count INTEGER;
BEGIN
    -- Verificar se quem está executando é admin
    IF current_user_id IS NOT NULL AND NOT is_admin(current_user_id) THEN
        RAISE EXCEPTION 'Apenas administradores podem remover admins';
    END IF;
    
    -- Verificar se não é o último admin
    SELECT COUNT(*) INTO admin_count FROM admin_users WHERE is_active = true;
    
    IF admin_count <= 1 THEN
        RAISE EXCEPTION 'Não é possível remover o último administrador';
    END IF;
    
    -- Desativar o admin (soft delete)
    UPDATE admin_users 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = target_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabela de audit logs para ações administrativas
CREATE TABLE admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    resource_type text,
    resource_id text,
    details jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela de audit logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins verem logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
  FOR SELECT
  USING (is_admin());

-- Função para registrar ações administrativas
CREATE OR REPLACE FUNCTION log_admin_action(
    action_name TEXT,
    resource_type TEXT DEFAULT NULL,
    resource_id TEXT DEFAULT NULL,
    details JSONB DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    current_user_id UUID := auth.uid();
BEGIN
    -- Verificar se quem está executando é admin
    IF current_user_id IS NULL OR NOT is_admin(current_user_id) THEN
        RAISE EXCEPTION 'Apenas administradores podem registrar ações';
    END IF;
    
    INSERT INTO admin_audit_logs (
        admin_user_id, 
        action, 
        resource_type, 
        resource_id, 
        details, 
        ip_address, 
        user_agent
    )
    VALUES (
        current_user_id, 
        action_name, 
        resource_type, 
        resource_id, 
        details, 
        ip_address, 
        user_agent
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE admin_users IS 'Tabela de controle de usuários administradores do sistema';
COMMENT ON TABLE admin_audit_logs IS 'Logs de auditoria das ações administrativas';
COMMENT ON FUNCTION is_admin(UUID) IS 'Verifica se um usuário é administrador ativo';
COMMENT ON FUNCTION add_admin_user(TEXT, UUID) IS 'Adiciona um novo usuário administrador';
COMMENT ON FUNCTION remove_admin_user(UUID) IS 'Remove (desativa) um usuário administrador';
COMMENT ON FUNCTION log_admin_action(TEXT, TEXT, TEXT, JSONB, INET, TEXT) IS 'Registra uma ação administrativa nos logs de auditoria';