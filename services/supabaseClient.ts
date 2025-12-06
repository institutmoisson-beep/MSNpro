
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec les nouvelles informations fournies
const SUPABASE_URL = 'https://xqsgzxsdcwgcgurtvddf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxc2d6eHNkY3dnY2d1cnR2ZGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDk1MDUsImV4cCI6MjA4MDYyNTUwNX0.flXou2iKW3az7o6jspi3ZZ_qBZrvvlfrO74J2qEX3cY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
