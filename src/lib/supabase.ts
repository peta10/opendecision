import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Declare global type for TypeScript
declare global {
  // eslint-disable-next-line no-var
  var __supabase_main__: ReturnType<typeof createClient> | undefined;
}

// Create singleton Supabase client
function createSupabaseClient() {
  // Return existing instance if available
  if (global.__supabase_main__) {
    return global.__supabase_main__;
  }

  // Check if environment variables are configured
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'https://placeholder.supabase.co' || 
      supabaseAnonKey === 'placeholder-key') {
    console.warn('Supabase environment variables not configured');
    return null;
  }
  
  // Create new client with explicit storage key
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'sb-open-decision-auth-token', // Single explicit storage key
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });
  
  // Store globally to survive HMR in development
  if (typeof window !== 'undefined') {
    (window as any).__supabase_main__ = client;
  }
  if (typeof global !== 'undefined') {
    global.__supabase_main__ = client as any;
  }
  
  console.info('✅ Supabase client initialized (singleton) - UNIFIED CLIENT');
  
  return client;
}

// Export singleton instance
export const supabase = createSupabaseClient();

export const isSupabaseConfigured = () => {
  return supabase !== null
}

export interface ContactFormData {
  name: string
  email: string
  company: string
  message: string
}

export async function submitContactForm(data: ContactFormData) {
  if (!supabase) {
    throw new Error('Supabase client not configured. Please check your environment variables.')
  }

  try {
    const { data: result, error } = await supabase
      .from('contact_submissions')
      .insert([{
        name: data.name,
        email: data.email,
        company: data.company,
        message: data.message,
        created_at: new Date().toISOString()
      }])
      .select()

    if (error) {
      throw error
    }

    return { data: result, error: null }
  } catch (error: any) {
    console.error('Error submitting contact form:', error)
    return { data: null, error }
  }
}