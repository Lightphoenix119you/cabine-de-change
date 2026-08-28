import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umlebtfygtmwjkmiydno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbGVidGZ5Z3Rtd2prbWl5ZG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3ODU1MTAsImV4cCI6MjEwMzM2MTUxMH0.uMTvJnYx8mbWLNxMPT08ggxH9HEyxArKoLze1w3XT3A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
