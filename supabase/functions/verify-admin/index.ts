import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface AdminVerificationResponse {
  isAdmin: boolean
  email?: string
  userId?: string
  error?: string
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
        JSON.stringify({ isAdmin: false, error: 'Server configuration error' }),
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
        JSON.stringify({ isAdmin: false, error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Missing token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the JWT token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Token verification failed:', userError)
      return new Response(
        JSON.stringify({ 
          isAdmin: false, 
          error: userError?.message || 'Invalid token',
          details: userError 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user is in admin_users table
    console.log('Checking admin status for user:', user.id, user.email)
    
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('user_id, email, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    console.log('Admin query result:', { adminData, adminError })

    if (adminError && adminError.code !== 'PGRST116') {
      console.error('Database error checking admin status:', adminError)
      return new Response(
        JSON.stringify({ 
          isAdmin: false, 
          error: 'Database error',
          details: adminError 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If no admin record found or user is not active
    if (!adminData) {
      // Log the unauthorized access attempt
      try {
        await supabaseAdmin
          .from('admin_audit_logs')
          .insert({
            admin_user_id: null,
            action: 'unauthorized_admin_access_attempt',
            resource_type: 'admin_panel',
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
        JSON.stringify({ isAdmin: false, error: 'Access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log successful admin verification
    try {
      await supabaseAdmin
        .from('admin_audit_logs')
        .insert({
          admin_user_id: user.id,
          action: 'admin_access_granted',
          resource_type: 'admin_panel',
          details: {
            timestamp: new Date().toISOString()
          },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent')
        })
    } catch (logError) {
      console.error('Failed to log admin access:', logError)
    }

    // Return success response
    const response: AdminVerificationResponse = {
      isAdmin: true,
      email: user.email,
      userId: user.id
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in verify-admin function:', error)
    return new Response(
      JSON.stringify({ isAdmin: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})