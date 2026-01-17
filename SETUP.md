# Syntxbattle Setup Guide

This guide provides detailed instructions for setting up the Syntxbattle environment on your local machine.

## Prerequisites

- Node.js (v22 or higher)
- pnpm

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/syntxbattle.git
cd syntxbattle
```

## 2. Install Dependencies

```bash
pnpm install
```

## 3. Supabase Setup

Syntxbattle uses Supabase for its backend. You can either use the Supabase cloud service or run it locally using Docker.

### Local Supabase Setup

1.  **Install the Supabase CLI:**

    ```bash
    pnpm add -g supabase
    ```

2.  **Start Supabase services:**

    ```bash
    supabase start
    ```

    This will start the Supabase Docker containers and provide you with local Supabase credentials.

### Cloud Supabase Setup

1.  Create a new project on [Supabase](https://supabase.com/).
2.  In your project settings, find the API credentials.

## 4. Environment Variables

Create a `.env.local` file in the root of the project and add the following environment variables:

```
# Your PostgreSQL connection string
DATABASE_URL="postgres://postgres:postgres@localhost:54322/postgres"

# Your Supabase project URL
PUBLIC_SUPABASE_URL="http://localhost:54321"

# Your Supabase anon key
PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

-   Replace the values with your local or cloud Supabase credentials.
-   The `DATABASE_URL` is used by Drizzle ORM for migrations.
-   `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` are used by the Supabase client.

## 5. Database Schema

Run the following SQL commands in your Supabase SQL editor to create the necessary tables.

```sql
-- Create the profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  is_online BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create the problems table
CREATE TABLE public.problems (
  id TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  difficulty TEXT,
  description TEXT NOT NULL,
  starter_code TEXT,
  test_cases JSONB NOT NULL
);

-- Create the matches table
CREATE TABLE public.matches (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  problem_id TEXT NOT NULL REFERENCES public.problems(id),
  status TEXT DEFAULT 'waiting',
  max_players INTEGER DEFAULT 2,
  creator_id uuid NOT NULL REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Create the match_participants table
CREATE TABLE public.match_participants (
  match_id uuid NOT NULL REFERENCES public.matches(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (match_id, user_id)
);

-- Create the leaderboard table
CREATE TABLE public.leaderboard (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  "language" TEXT NOT NULL,
  solved_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    'user-' || substr(new.id::text, 1, 8),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', 'https://api.dicebear.com/9.x/bottts/svg?seed=' || new.id::text)
  );
  RETURN new;
END;
$$;

-- Create the trigger to execute the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

```

## 6. Run the Application

```bash
pnpm dev
```

Your application should now be running at `http://localhost:5173`.
