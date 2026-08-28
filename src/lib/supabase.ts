import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://umlebtfygtmwjkmiydno.supabase.co';
const supabaseAnonKey = 'TA_CLE_ANON_QUI_COMMENCE_PAR_EYJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
