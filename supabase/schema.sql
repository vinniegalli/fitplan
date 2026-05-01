-- ============================================================
-- FitPlan SaaS — Schema + RLS
-- Run this in Supabase SQL Editor (once, in order)
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- TABLES
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.trainers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  plan        text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  theme       jsonb NOT NULL DEFAULT '{"primary":"#e8192c","primaryDim":"#a01020","bg":"#0a0a0a","surface":"#111111","surface2":"#1a1a1a","border":"#2a2a2a","text":"#e8e8e8","muted":"#888888","accent":"#ff4d5e"}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  uuid NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text NOT NULL,
  age         int,
  weight      numeric(5,1),
  height      numeric(4,2),
  goal        text,
  level       text CHECK (level IN ('iniciante','intermediário','avançado')),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trainer_id, slug)
);

CREATE TABLE IF NOT EXISTS public.training_plans (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id        uuid NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  division_type     text NOT NULL,   -- 'PPL', 'ABC', 'ABCDE', 'AB', 'Full Body'
  total_weeks       int NOT NULL DEFAULT 12,
  sessions_per_week int,
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_days (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     uuid NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  day_code    text,          -- 'push-a', 'A', 'peito', etc.
  label       text NOT NULL, -- 'Push A', 'Treino A'
  focus       text,          -- 'Peito / Ombro / Tríceps'
  warmup      text,
  day_order   int NOT NULL
);

CREATE TABLE IF NOT EXISTS public.exercises (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id   uuid NOT NULL REFERENCES public.workout_days(id) ON DELETE CASCADE,
  name             text NOT NULL,
  type             text NOT NULL DEFAULT 'isolation' CHECK (type IN ('compound','cluster','isolation')),
  cluster_block    text,          -- '(3×3)' only when type='cluster'
  rest_time        text,
  notes            text,
  exercise_order   int NOT NULL
);

CREATE TABLE IF NOT EXISTS public.periodization_weeks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id           uuid NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  week_number       int NOT NULL,
  sets_range        text NOT NULL DEFAULT '3',
  reps_range        text NOT NULL DEFAULT '8–12',
  is_cluster        boolean NOT NULL DEFAULT false,
  volume_label      text,          -- 'Baixo' | 'Médio' | 'Alto' | 'Deload'
  intensity_label   text,          -- 'Baixa' | 'Média' | 'Alta'
  observation       text,
  UNIQUE(plan_id, week_number)
);

-- ──────────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_students_trainer   ON public.students(trainer_id);
CREATE INDEX IF NOT EXISTS idx_plans_student      ON public.training_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_plans_trainer      ON public.training_plans(trainer_id);
CREATE INDEX IF NOT EXISTS idx_days_plan          ON public.workout_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_exercises_day      ON public.exercises(workout_day_id);
CREATE INDEX IF NOT EXISTS idx_periods_plan       ON public.periodization_weeks(plan_id);
CREATE INDEX IF NOT EXISTS idx_trainers_slug      ON public.trainers(slug);
CREATE INDEX IF NOT EXISTS idx_students_slug      ON public.students(trainer_id, slug);

-- ──────────────────────────────────────────────────────────────
-- PHASE 2 — WORKOUT SESSIONS + SET RECORDS
-- ──────────────────────────────────────────────────────────────

-- Video support on exercises (ALTER if table already exists)
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS video_url          text,
  ADD COLUMN IF NOT EXISTS video_type         text CHECK (video_type IN ('system','custom','external')),
  ADD COLUMN IF NOT EXISTS video_storage_path text;

-- Each time a student starts a workout
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  workout_day_id  uuid NOT NULL REFERENCES public.workout_days(id) ON DELETE CASCADE,
  week_number     int NOT NULL,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  notes           text
);

-- Each set performed during a session
CREATE TABLE IF NOT EXISTS public.set_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id  uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number   int NOT NULL,
  weight       numeric(6,2),
  reps         int,
  completed    boolean NOT NULL DEFAULT false,
  recorded_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_student   ON public.workout_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_day       ON public.workout_sessions(workout_day_id);
CREATE INDEX IF NOT EXISTS idx_sets_session       ON public.set_records(session_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise      ON public.set_records(exercise_id);

-- ── RLS on new tables ─────────────────────────────────────────

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_records      ENABLE ROW LEVEL SECURITY;

-- Any public user can INSERT sessions (student uses public URL, no auth)
CREATE POLICY "sessions: public insert" ON public.workout_sessions
  FOR INSERT WITH CHECK (true);

-- Public read (student can read own sessions, trainer via join)
CREATE POLICY "sessions: public read" ON public.workout_sessions
  FOR SELECT USING (true);

-- Public update (student can complete their own session)
CREATE POLICY "sessions: public update" ON public.workout_sessions
  FOR UPDATE USING (true);

-- Any public user can INSERT set records
CREATE POLICY "sets: public insert" ON public.set_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "sets: public read" ON public.set_records
  FOR SELECT USING (true);

CREATE POLICY "sets: public update" ON public.set_records
  FOR UPDATE USING (true);

CREATE POLICY "sets: public delete" ON public.set_records
  FOR DELETE USING (true);

-- ──────────────────────────────────────────────────────────────
-- RLS — Enable on all tables
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.trainers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodization_weeks ENABLE ROW LEVEL SECURITY;

-- ── trainers ──────────────────────────────────────────────────
CREATE POLICY "trainer: own row" ON public.trainers
  FOR ALL USING (auth.uid() = user_id);

-- Public read by slug (for student public view)
CREATE POLICY "trainer: public read by slug" ON public.trainers
  FOR SELECT USING (true);

-- ── students ──────────────────────────────────────────────────
CREATE POLICY "students: own trainer" ON public.students
  FOR ALL USING (
    trainer_id IN (SELECT id FROM public.trainers WHERE user_id = auth.uid())
  );

-- Public read (for student public view)
CREATE POLICY "students: public read" ON public.students
  FOR SELECT USING (true);

-- ── training_plans ────────────────────────────────────────────
CREATE POLICY "plans: own trainer" ON public.training_plans
  FOR ALL USING (
    trainer_id IN (SELECT id FROM public.trainers WHERE user_id = auth.uid())
  );

CREATE POLICY "plans: public read" ON public.training_plans
  FOR SELECT USING (true);

-- ── workout_days ──────────────────────────────────────────────
CREATE POLICY "days: own trainer" ON public.workout_days
  FOR ALL USING (
    plan_id IN (
      SELECT id FROM public.training_plans
      WHERE trainer_id IN (SELECT id FROM public.trainers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "days: public read" ON public.workout_days
  FOR SELECT USING (true);

-- ── exercises ─────────────────────────────────────────────────
CREATE POLICY "exercises: own trainer" ON public.exercises
  FOR ALL USING (
    workout_day_id IN (
      SELECT d.id FROM public.workout_days d
      JOIN public.training_plans p ON p.id = d.plan_id
      WHERE p.trainer_id IN (SELECT id FROM public.trainers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "exercises: public read" ON public.exercises
  FOR SELECT USING (true);

-- ── periodization_weeks ───────────────────────────────────────
CREATE POLICY "periods: own trainer" ON public.periodization_weeks
  FOR ALL USING (
    plan_id IN (
      SELECT id FROM public.training_plans
      WHERE trainer_id IN (SELECT id FROM public.trainers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "periods: public read" ON public.periodization_weeks
  FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────────
-- TRIGGER — auto-create trainer row on signup
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter   int := 0;
BEGIN
  -- derive slug from email prefix, lowercase, no special chars
  base_slug := regexp_replace(
    lower(split_part(NEW.email, '@', 1)),
    '[^a-z0-9]', '-', 'g'
  );
  final_slug := base_slug;

  -- ensure uniqueness
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.trainers WHERE slug = final_slug);
    counter    := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  INSERT INTO public.trainers (user_id, name, slug)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    final_slug
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
