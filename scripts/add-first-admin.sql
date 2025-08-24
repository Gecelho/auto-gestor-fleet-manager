-- Script para adicionar o primeiro administrador
-- IMPORTANTE: Execute este script apenas com SERVICE_ROLE_KEY
-- Substitua 'SEU_EMAIL_AQUI' pelo email do primeiro administrador

-- Primeiro, encontre o user_id do usuário pelo email
-- (você deve substituir 'SEU_EMAIL_AQUI' pelo email real)
DO $$
DECLARE
    target_email TEXT := 'SEU_EMAIL_AQUI'; -- SUBSTITUA PELO EMAIL REAL
    target_user_id UUID;
BEGIN
    -- Buscar o user_id pelo email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_email;
    
    -- Verificar se o usuário foi encontrado
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado. Certifique-se de que o usuário já fez login pelo menos uma vez.', target_email;
    END IF;
    
    -- Verificar se já é admin
    IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = target_user_id) THEN
        RAISE NOTICE 'Usuário % já é administrador.', target_email;
    ELSE
        -- Inserir como admin
        INSERT INTO admin_users (user_id, email, created_by)
        VALUES (target_user_id, target_email, NULL);
        
        RAISE NOTICE 'Usuário % adicionado como administrador com sucesso!', target_email;
        
        -- Log da ação
        INSERT INTO admin_audit_logs (
            admin_user_id, 
            action, 
            resource_type, 
            details
        )
        VALUES (
            NULL, -- Sistema adicionou
            'first_admin_added', 
            'admin_users',
            jsonb_build_object(
                'email', target_email,
                'user_id', target_user_id,
                'timestamp', NOW()
            )
        );
    END IF;
END $$;

-- Verificar se foi adicionado corretamente
SELECT 
    au.email,
    au.created_at,
    au.is_active,
    u.email as auth_email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'SEU_EMAIL_AQUI'; -- SUBSTITUA PELO EMAIL REAL