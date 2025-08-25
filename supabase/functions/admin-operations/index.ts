import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface AdminOperationRequest {
  operation: string
  data?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Token verification failed:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('user_id, email, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminData) {
      // Log unauthorized access attempt
      try {
        await supabaseAdmin
          .from('admin_audit_logs')
          .insert({
            admin_user_id: null,
            action: 'unauthorized_admin_operation_attempt',
            resource_type: 'admin_operations',
            details: {
              user_id: user.id,
              email: user.email,
              timestamp: new Date().toISOString()
            },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent')
          })
      } catch (logError) {
        console.error('Failed to log unauthorized access attempt:', logError)
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const requestBody: AdminOperationRequest = await req.json()
    const { operation, data } = requestBody

    let result: any = { success: false }

    // Handle different operations
    switch (operation) {
      case 'get_stats':
        result = await getSystemStats(supabaseAdmin)
        break
        
      case 'get_admin_users':
        result = await getAdminUsers(supabaseAdmin)
        break
        
      case 'get_audit_logs':
        result = await getAuditLogs(supabaseAdmin, data?.limit || 50)
        break
        
      case 'add_admin':
        result = await addAdminUser(supabaseAdmin, user.id, data)
        break
        
      case 'remove_admin':
        result = await removeAdminUser(supabaseAdmin, user.id, data)
        break
        
      case 'update_subscription':
        result = await updateUserSubscription(supabaseAdmin, user.id, data)
        break
        
      case 'search_users':
        result = await searchUsers(supabaseAdmin, data)
        break
        
      case 'get_user_details':
        result = await getUserDetails(supabaseAdmin, data)
        break
        
      case 'update_user':
        result = await updateUser(supabaseAdmin, user.id, data)
        break
        
      case 'delete_user':
        result = await deleteUser(supabaseAdmin, user.id, data)
        break
        
      case 'get_all_users':
        result = await getAllUsers(supabaseAdmin, data)
        break
        
      default:
        result = { success: false, error: 'Unknown operation' }
    }

    // Log the admin action
    try {
      await supabaseAdmin
        .from('admin_audit_logs')
        .insert({
          admin_user_id: user.id,
          action: `admin_operation_${operation}`,
          resource_type: 'admin_operations',
          details: {
            operation,
            success: result.success,
            timestamp: new Date().toISOString(),
            data: data || null
          },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent')
        })
    } catch (logError) {
      console.error('Failed to log admin action:', logError)
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in admin-operations function:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper functions
async function getSystemStats(supabaseAdmin: any) {
  try {
    // Get total users
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get total cars
    const { count: totalCars } = await supabaseAdmin
      .from('cars')
      .select('*', { count: 'exact', head: true })

    // Get revenue and expenses totals
    const { data: revenueData } = await supabaseAdmin
      .from('revenues')
      .select('amount')

    const { data: expenseData } = await supabaseAdmin
      .from('expenses')
      .select('amount')

    const totalRevenue = revenueData?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0
    const totalExpenses = expenseData?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0

    // Get subscription stats
    const { data: subscriptionData } = await supabaseAdmin
      .from('users')
      .select('subscription_status')

    const activeSubscriptions = subscriptionData?.filter((u: any) => 
      u.subscription_status === 'active' || u.subscription_status === 'trial'
    ).length || 0

    const expiredSubscriptions = subscriptionData?.filter((u: any) => 
      u.subscription_status === 'expired' || u.subscription_status === 'suspended'
    ).length || 0

    return {
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalCars: totalCars || 0,
        totalRevenue,
        totalExpenses,
        activeSubscriptions,
        expiredSubscriptions
      }
    }
  } catch (error) {
    console.error('Error getting system stats:', error)
    return { success: false, error: 'Failed to get system stats' }
  }
}

async function getAdminUsers(supabaseAdmin: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error getting admin users:', error)
    return { success: false, error: 'Failed to get admin users' }
  }
}

async function getAuditLogs(supabaseAdmin: any, limit: number = 50) {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error getting audit logs:', error)
    return { success: false, error: 'Failed to get audit logs' }
  }
}

async function addAdminUser(supabaseAdmin: any, currentUserId: string, data: any) {
  try {
    const { email, userId } = data

    if (!email) {
      return { success: false, error: 'Email is required' }
    }

    // Call the database function to add admin
    const { data: result, error } = await supabaseAdmin
      .rpc('add_admin_user', {
        target_email: email,
        target_user_id: userId || null
      })

    if (error) throw error

    return { success: true, data: result }
  } catch (error) {
    console.error('Error adding admin user:', error)
    return { success: false, error: error.message || 'Failed to add admin user' }
  }
}

async function removeAdminUser(supabaseAdmin: any, currentUserId: string, data: any) {
  try {
    const { userId } = data

    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    // Call the database function to remove admin
    const { data: result, error } = await supabaseAdmin
      .rpc('remove_admin_user', {
        target_user_id: userId
      })

    if (error) throw error

    return { success: true, data: result }
  } catch (error) {
    console.error('Error removing admin user:', error)
    return { success: false, error: error.message || 'Failed to remove admin user' }
  }
}

async function updateUserSubscription(supabaseAdmin: any, currentUserId: string, data: any) {
  try {
    const { userId, status, plan, expiresAt } = data

    if (!userId || !status || !plan) {
      return { success: false, error: 'User ID, status, and plan are required' }
    }

    // Call the database function to update subscription
    const { data: result, error } = await supabaseAdmin
      .rpc('admin_update_subscription', {
        target_user_id: userId,
        new_status: status,
        new_plan: plan,
        new_expires_at: expiresAt
      })

    if (error) throw error

    return { success: true, data: result }
  } catch (error) {
    console.error('Error updating user subscription:', error)
    return { success: false, error: error.message || 'Failed to update subscription' }
  }
}

async function searchUsers(supabaseAdmin: any, data: any) {
  try {
    const { query, limit = 50 } = data

    if (!query) {
      return { success: false, error: 'Search query is required' }
    }

    // Search users by name, email, phone, or CPF
    // Also search by car plate
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        cars (
          id,
          name,
          plate,
          image_url,
          status,
          drivers (
            id,
            name,
            phone,
            cpf
          )
        )
      `)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(limit)

    if (usersError) throw usersError

    // Also search by car plate or driver CPF
    const { data: carUsers, error: carError } = await supabaseAdmin
      .from('cars')
      .select(`
        user_id,
        users!inner (
          *,
          cars (
            id,
            name,
            plate,
            image_url,
            status,
            drivers (
              id,
              name,
              phone,
              cpf
            )
          )
        )
      `)
      .or(`plate.ilike.%${query}%`)
      .limit(limit)

    if (carError) throw carError

    // Search by driver CPF
    const { data: driverUsers, error: driverError } = await supabaseAdmin
      .from('drivers')
      .select(`
        owner_id,
        users!drivers_owner_id_fkey (
          *,
          cars (
            id,
            name,
            plate,
            image_url,
            status,
            drivers (
              id,
              name,
              phone,
              cpf
            )
          )
        )
      `)
      .or(`cpf.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(limit)

    if (driverError) throw driverError

    // Combine and deduplicate results
    const allUsers = new Map()
    
    users?.forEach(user => allUsers.set(user.id, user))
    carUsers?.forEach(item => allUsers.set(item.users.id, item.users))
    driverUsers?.forEach(item => allUsers.set(item.users.id, item.users))

    const results = Array.from(allUsers.values())

    return { success: true, data: results }
  } catch (error) {
    console.error('Error searching users:', error)
    return { success: false, error: error.message || 'Failed to search users' }
  }
}

async function getUserDetails(supabaseAdmin: any, data: any) {
  try {
    const { userId } = data

    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    // Get complete user details with all related data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        cars (
          *,
          drivers (*),
          car_current_mileage (*),
          expenses (
            *
          ),
          revenues (
            *
          ),
          future_expenses (
            *
          )
        )
      `)
      .eq('id', userId)
      .single()

    if (userError) throw userError

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Calculate totals
    let totalRevenue = 0
    let totalExpenses = 0
    let totalCars = user.cars?.length || 0

    user.cars?.forEach((car: any) => {
      car.revenues?.forEach((revenue: any) => {
        totalRevenue += revenue.value || 0
      })
      car.expenses?.forEach((expense: any) => {
        totalExpenses += expense.value || 0
      })
    })

    return {
      success: true,
      data: {
        ...user,
        summary: {
          totalCars,
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses
        }
      }
    }
  } catch (error) {
    console.error('Error getting user details:', error)
    return { success: false, error: error.message || 'Failed to get user details' }
  }
}

async function updateUser(supabaseAdmin: any, currentUserId: string, data: any) {
  try {
    const { userId, updates } = data

    if (!userId || !updates) {
      return { success: false, error: 'User ID and updates are required' }
    }

    // Validate and clean updates
    const cleanUpdates = { ...updates }
    
    // Always set updated_at
    cleanUpdates.updated_at = new Date().toISOString()

    // Validate subscription_expires_at if present
    if (cleanUpdates.subscription_expires_at) {
      try {
        // Ensure it's a valid date
        const date = new Date(cleanUpdates.subscription_expires_at)
        if (isNaN(date.getTime())) {
          delete cleanUpdates.subscription_expires_at
        } else {
          cleanUpdates.subscription_expires_at = date.toISOString()
        }
      } catch (dateError) {
        console.error('Invalid date format:', cleanUpdates.subscription_expires_at)
        delete cleanUpdates.subscription_expires_at
      }
    }

    // Validate subscription_status
    if (cleanUpdates.subscription_status && 
        !['active', 'trial', 'expired', 'suspended'].includes(cleanUpdates.subscription_status)) {
      return { success: false, error: 'Invalid subscription status' }
    }

    // Validate subscription_plan
    if (cleanUpdates.subscription_plan && 
        !['basic', 'premium', 'enterprise'].includes(cleanUpdates.subscription_plan)) {
      return { success: false, error: 'Invalid subscription plan' }
    }

    // Update user data
    const { data: result, error } = await supabaseAdmin
      .from('users')
      .update(cleanUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data: result }
  } catch (error) {
    console.error('Error updating user:', error)
    return { success: false, error: error.message || 'Failed to update user' }
  }
}

async function deleteUser(supabaseAdmin: any, currentUserId: string, data: any) {
  try {
    const { userId, deleteAllData = false } = data

    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    if (userId === currentUserId) {
      return { success: false, error: 'Cannot delete your own account' }
    }

    if (deleteAllData) {
      // Delete from auth.users first (this will cascade to other tables)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.error('Error deleting user from auth:', authError)
        throw new Error(`Failed to delete user from authentication: ${authError.message}`)
      }

      // The database triggers should handle cascading deletes from the users table
      // But let's also explicitly delete from users table if it still exists
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)

      // Don't throw error if user doesn't exist in users table (might have been deleted by cascade)
      if (dbError && dbError.code !== 'PGRST116') {
        console.error('Error deleting user from users table:', dbError)
        throw dbError
      }
    } else {
      // Just deactivate the user
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          subscription_status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
    }

    return { success: true, data: { deleted: deleteAllData, userId } }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: error.message || 'Failed to delete user' }
  }
}

async function getAllUsers(supabaseAdmin: any, data: any) {
  try {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = data

    const offset = (page - 1) * limit

    const { data: users, error, count } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        cars (
          id,
          name,
          plate,
          status
        )
      `, { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      success: true,
      data: {
        users: users || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    }
  } catch (error) {
    console.error('Error getting all users:', error)
    return { success: false, error: error.message || 'Failed to get users' }
  }
}