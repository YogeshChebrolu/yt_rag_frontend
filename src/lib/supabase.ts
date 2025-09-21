import { createClient } from "@supabase/supabase-js"

// const supabaseUrl = import.meta.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabaseUrl = "https://sofowbahdzuboflvuprw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZm93YmFoZHp1Ym9mbHZ1cHJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NjI5OTgsImV4cCI6MjA3MzQzODk5OH0.heJw1NK4IgybbqFYXHYURrUVAlLoJlQeH_X9TqFJh50"

export const supabase = createClient(
    supabaseUrl, supabaseKey
)