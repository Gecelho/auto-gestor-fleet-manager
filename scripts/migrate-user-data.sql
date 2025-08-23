-- Script para migrar dados existentes para um usuário específico
-- INSTRUÇÕES:
-- 1. Faça login na aplicação com sua conta Google
-- 2. Execute: SELECT id, email FROM auth.users WHERE email = 'seu-email@gmail.com';
-- 3. Substitua 'SEU-USER-ID-AQUI' pelo ID obtido no passo 2
-- 4. Execute este script no SQL Editor do Supabase

-- ⚠️ IMPORTANTE: Substitua 'SEU-USER-ID-AQUI' pelo seu ID real!
SELECT migrate_data_to_user('SEU-USER-ID-AQUI');

-- Verificar se a migração funcionou
SELECT 
  'Carros migrados: ' || COUNT(*) as resultado
FROM public.cars 
WHERE user_id IS NOT NULL

UNION ALL

SELECT 
  'Despesas migradas: ' || COUNT(*) as resultado
FROM public.expenses 
WHERE user_id IS NOT NULL

UNION ALL

SELECT 
  'Receitas migradas: ' || COUNT(*) as resultado
FROM public.revenues 
WHERE user_id IS NOT NULL

UNION ALL

SELECT 
  'Motoristas migrados: ' || COUNT(*) as resultado
FROM public.drivers 
WHERE owner_id IS NOT NULL;

-- Ver seus dados
SELECT 'Seus carros:' as tipo, name as nome, plate as info FROM public.cars WHERE user_id = 'SEU-USER-ID-AQUI'
UNION ALL
SELECT 'Suas despesas:', description, value::text FROM public.expenses WHERE user_id = 'SEU-USER-ID-AQUI' LIMIT 5
UNION ALL
SELECT 'Suas receitas:', description, value::text FROM public.revenues WHERE user_id = 'SEU-USER-ID-AQUI' LIMIT 5
UNION ALL
SELECT 'Seus motoristas:', name, phone FROM public.drivers WHERE owner_id = 'SEU-USER-ID-AQUI';