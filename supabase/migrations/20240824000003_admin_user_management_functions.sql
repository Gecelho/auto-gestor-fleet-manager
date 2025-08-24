-- Função para atualizar assinatura de usuário (admin)
CREATE OR REPLACE FUNCTION admin_update_subscription(
  target_user_id UUID,
  new_status TEXT,
  new_plan TEXT,
  new_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = target_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Atualizar a assinatura
  UPDATE users 
  SET 
    subscription_status = new_status,
    subscription_plan = new_plan,
    subscription_expires_at = COALESCE(new_expires_at, subscription_expires_at),
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Retornar sucesso
  SELECT json_build_object(
    'success', true,
    'message', 'Subscription updated successfully',
    'user_id', target_user_id,
    'new_status', new_status,
    'new_plan', new_plan,
    'new_expires_at', new_expires_at
  ) INTO result;

  RETURN result;
END;
$$;

-- Função para buscar usuários com filtros avançados
CREATE OR REPLACE FUNCTION search_users_advanced(
  search_query TEXT,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  subscription_status TEXT,
  subscription_plan TEXT,
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_cars BIGINT,
  total_revenue NUMERIC,
  total_expenses NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.full_name,
    u.email,
    u.phone,
    u.company_name,
    u.subscription_status,
    u.subscription_plan,
    u.subscription_expires_at,
    u.created_at,
    u.updated_at,
    COALESCE(car_counts.total_cars, 0) as total_cars,
    COALESCE(revenue_totals.total_revenue, 0) as total_revenue,
    COALESCE(expense_totals.total_expenses, 0) as total_expenses
  FROM users u
  LEFT JOIN (
    SELECT user_id, COUNT(*) as total_cars
    FROM cars
    GROUP BY user_id
  ) car_counts ON u.id = car_counts.user_id
  LEFT JOIN (
    SELECT user_id, SUM(value) as total_revenue
    FROM revenues
    GROUP BY user_id
  ) revenue_totals ON u.id = revenue_totals.user_id
  LEFT JOIN (
    SELECT user_id, SUM(value) as total_expenses
    FROM expenses
    GROUP BY user_id
  ) expense_totals ON u.id = expense_totals.user_id
  WHERE 
    u.full_name ILIKE '%' || search_query || '%' OR
    u.email ILIKE '%' || search_query || '%' OR
    u.phone ILIKE '%' || search_query || '%' OR
    u.id::TEXT IN (
      SELECT DISTINCT c.user_id::TEXT
      FROM cars c
      WHERE c.plate ILIKE '%' || search_query || '%'
    ) OR
    u.id::TEXT IN (
      SELECT DISTINCT d.owner_id::TEXT
      FROM drivers d
      WHERE d.cpf ILIKE '%' || search_query || '%' OR d.phone ILIKE '%' || search_query || '%'
    )
  ORDER BY u.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Função para obter detalhes completos de um usuário
CREATE OR REPLACE FUNCTION get_user_complete_details(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data JSON;
  cars_data JSON;
  summary_data JSON;
  result JSON;
BEGIN
  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = target_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Obter dados do usuário
  SELECT to_json(u.*) INTO user_data
  FROM users u
  WHERE u.id = target_user_id;

  -- Obter dados dos carros com relacionamentos
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'name', c.name,
      'plate', c.plate,
      'image_url', c.image_url,
      'purchase_value', c.purchase_value,
      'payment_method', c.payment_method,
      'purchase_date', c.purchase_date,
      'mileage', c.mileage,
      'notes', c.notes,
      'status', c.status,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'current_mileage', cm.current_mileage,
      'drivers', (
        SELECT json_agg(
          json_build_object(
            'id', d.id,
            'name', d.name,
            'phone', d.phone,
            'cpf', d.cpf,
            'address', d.address,
            'created_at', d.created_at
          )
        )
        FROM drivers d
        WHERE d.car_id = c.id
      ),
      'revenues', (
        SELECT json_agg(
          json_build_object(
            'id', r.id,
            'description', r.description,
            'value', r.value,
            'date', r.date,
            'type', r.type,
            'created_at', r.created_at
          )
        )
        FROM revenues r
        WHERE r.car_id = c.id
      ),
      'expenses', (
        SELECT json_agg(
          json_build_object(
            'id', e.id,
            'description', e.description,
            'value', e.value,
            'date', e.date,
            'observation', e.observation,
            'mileage', e.mileage,
            'next_mileage', e.next_mileage,
            'paid', e.paid,
            'created_at', e.created_at
          )
        )
        FROM expenses e
        WHERE e.car_id = c.id
      )
    )
  ) INTO cars_data
  FROM cars c
  LEFT JOIN car_current_mileage cm ON c.id = cm.car_id
  WHERE c.user_id = target_user_id;

  -- Calcular resumo
  SELECT json_build_object(
    'total_cars', COALESCE(car_count.total, 0),
    'total_revenue', COALESCE(revenue_sum.total, 0),
    'total_expenses', COALESCE(expense_sum.total, 0),
    'net_profit', COALESCE(revenue_sum.total, 0) - COALESCE(expense_sum.total, 0)
  ) INTO summary_data
  FROM (
    SELECT COUNT(*) as total
    FROM cars
    WHERE user_id = target_user_id
  ) car_count
  CROSS JOIN (
    SELECT COALESCE(SUM(value), 0) as total
    FROM revenues
    WHERE user_id = target_user_id
  ) revenue_sum
  CROSS JOIN (
    SELECT COALESCE(SUM(value), 0) as total
    FROM expenses
    WHERE user_id = target_user_id
  ) expense_sum;

  -- Combinar tudo
  SELECT json_build_object(
    'success', true,
    'data', json_build_object(
      'user', user_data,
      'cars', COALESCE(cars_data, '[]'::json),
      'summary', summary_data
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Função para deletar usuário e todos os dados relacionados
CREATE OR REPLACE FUNCTION admin_delete_user_complete(
  target_user_id UUID,
  delete_all_data BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verificar se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = target_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  IF delete_all_data THEN
    -- Deletar todos os dados relacionados (cascata será tratada pelas constraints)
    DELETE FROM users WHERE id = target_user_id;
    
    SELECT json_build_object(
      'success', true,
      'message', 'User and all related data deleted permanently',
      'user_id', target_user_id,
      'action', 'permanent_delete'
    ) INTO result;
  ELSE
    -- Apenas suspender o usuário
    UPDATE users 
    SET 
      subscription_status = 'suspended',
      updated_at = NOW()
    WHERE id = target_user_id;
    
    SELECT json_build_object(
      'success', true,
      'message', 'User suspended successfully',
      'user_id', target_user_id,
      'action', 'suspend'
    ) INTO result;
  END IF;

  RETURN result;
END;
$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION admin_update_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION search_users_advanced TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_complete_details TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user_complete TO authenticated;