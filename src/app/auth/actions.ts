'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  return redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })

  if (error) {
    return redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`)
  }

  return redirect('/auth/login?message=Check%20your%20email%20to%20verify%20your%20account%20before%20signing%20in.')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/')
}
