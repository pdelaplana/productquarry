-- Fix customer creation to only create for real signups, not voting users
-- Voting users authenticate via OTP without name metadata
-- Real customers sign up with password and provide name metadata

-- Update the function to only create customer records for users with name metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create customer if user has name in metadata (real signup)
  -- Voting users won't have this, so they won't get customer accounts
  IF NEW.raw_user_meta_data->>'name' IS NOT NULL THEN
    INSERT INTO public.customers (id, email, name, slug)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'name',
      lower(regexp_replace(
        NEW.raw_user_meta_data->>'name',
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      )) || '-' || substr(md5(random()::text), 1, 6)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
