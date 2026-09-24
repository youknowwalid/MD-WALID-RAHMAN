-- Run this in your Supabase SQL Editor to create tables matching the schema:

-- 1. Users table (for admin role tracking)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY, -- matches auth.users id
  email TEXT,
  isAdmin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Site Config table
CREATE TABLE IF NOT EXISTS public.site_config (
  id TEXT PRIMARY KEY, -- 'global', 'seo', 'hero'
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  link TEXT,
  slug TEXT,
  content TEXT,
  tags TEXT[],
  gallery TEXT[],
  social_title TEXT,
  social_description TEXT,
  social_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Services table
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  display_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Blog posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  image TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  author TEXT,
  social_title TEXT,
  social_description TEXT,
  social_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Resume items table
CREATE TABLE IF NOT EXISTS public.resume (
  id TEXT PRIMARY KEY,
  year TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  "desc" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Pricing plans table
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  features TEXT[],
  unavailable_features TEXT[],
  show_priority_box BOOLEAN,
  priority_title TEXT,
  priority_subtitle TEXT,
  button_text TEXT,
  button_url TEXT,
  accent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Contact submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Products table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  short_title TEXT,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  image TEXT NOT NULL,
  paddle_url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT TRUE,
  gallery1 TEXT,
  gallery2 TEXT,
  gallery3 TEXT,
  gallery4 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on Row Level Security (RLS) or grant public read access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to content
CREATE POLICY "Public read projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public read blog_posts" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Public read resume" ON public.resume FOR SELECT USING (true);
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Public read pricing_plans" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Public read skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read site_config" ON public.site_config FOR SELECT USING (true);

-- Allow public submit contact form
CREATE POLICY "Public insert contact_submissions" ON public.contact_submissions FOR INSERT WITH CHECK (true);

-- Allow authenticated users to do all actions (or full access for anon if desired during setup)
CREATE POLICY "Full access to site_config for all" ON public.site_config FOR ALL USING (true);
CREATE POLICY "Full access to projects for all" ON public.projects FOR ALL USING (true);
CREATE POLICY "Full access to services for all" ON public.services FOR ALL USING (true);
CREATE POLICY "Full access to blog_posts for all" ON public.blog_posts FOR ALL USING (true);
CREATE POLICY "Full access to resume for all" ON public.resume FOR ALL USING (true);
CREATE POLICY "Full access to testimonials for all" ON public.testimonials FOR ALL USING (true);
CREATE POLICY "Full access to pricing_plans for all" ON public.pricing_plans FOR ALL USING (true);
CREATE POLICY "Full access to skills for all" ON public.skills FOR ALL USING (true);
CREATE POLICY "Full access to products for all" ON public.products FOR ALL USING (true);
CREATE POLICY "Full access to users for all" ON public.users FOR ALL USING (true);
CREATE POLICY "Full access to contact_submissions for all" ON public.contact_submissions FOR ALL USING (true);
