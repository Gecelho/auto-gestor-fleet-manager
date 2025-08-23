import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check subscription status
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('subscription_status, subscription_expires_at')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user subscription:', userError)
      return new Response(
        JSON.stringify({ error: 'Failed to check subscription' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate subscription
    const now = new Date()
    const expiryDate = userData.subscription_expires_at ? new Date(userData.subscription_expires_at) : null
    
    const isActive = userData.subscription_status !== 'expired' && 
                    userData.subscription_status !== 'suspended' &&
                    (expiryDate ? expiryDate > now : true)

    if (!isActive) {
      // Update status to expired if needed
      if (expiryDate && expiryDate <= now && userData.subscription_status !== 'expired') {
        await supabaseClient
          .from('users')
          .update({ subscription_status: 'expired' })
          .eq('id', user.id)
      }

      return new Response(
        JSON.stringify({ 
          error: 'Subscription expired or inactive',
          subscription_status: userData.subscription_status,
          expires_at: userData.subscription_expires_at
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If subscription is active, return success
    return new Response(
      JSON.stringify({ 
        success: true,
        subscription_status: userData.subscription_status,
        expires_at: userData.subscription_expires_at,
        days_remaining: expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Subscription guard error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})