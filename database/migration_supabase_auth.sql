-- =============================================================================
-- Migration: Add Supabase Auth Sync Trigger
-- Links auth.users to public.users
-- =============================================================================

-- 1. Add auth_id to users if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'auth_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Create the sync function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    _full_name TEXT;
    _role TEXT;
    _phone TEXT;
    _id_doc TEXT;
    _verification_status TEXT;
BEGIN
    -- Extract values from metadata, default if missing
    _full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.email);
    _role := COALESCE(new.raw_user_meta_data->>'role', 'Student');
    _phone := COALESCE(new.raw_user_meta_data->>'phone', 'N/A');
    _id_doc := new.raw_user_meta_data->>'id_document_path';
    
    -- Landlords require verification, Students are approved instantly
    IF _role = 'Landlord' THEN
        _verification_status := 'Pending';
    ELSE
        _verification_status := 'Approved';
    END IF;

    -- Check if a user with this email already exists (e.g. seeded demo users)
    IF EXISTS (SELECT 1 FROM public.users WHERE email = new.email) THEN
        UPDATE public.users
        SET auth_id = new.id
        WHERE email = new.email;
    ELSE
        INSERT INTO public.users (auth_id, full_name, email, phone, role, verification_status, id_document_path, password_hash)
        VALUES (
            new.id,
            _full_name,
            new.email,
            _phone,
            _role,
            _verification_status,
            _id_doc,
            'supabase_auth_managed' -- placeholder since Supabase handles passwords
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
