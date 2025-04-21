-- Update profiles table to replace telnyx_login_token with SIP credentials
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS telnyx_login_token,
ADD COLUMN IF NOT EXISTS sip_username TEXT,
ADD COLUMN IF NOT EXISTS sip_password TEXT;
