// Shared TypeScript types matching the DB schema

export type Plan = "free" | "pro";

export interface TrainerTheme {
  primary: string;
  primaryDim: string;
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
}

export const DEFAULT_THEME: TrainerTheme = {
  primary: "#e8192c",
  primaryDim: "#a01020",
  bg: "#0a0a0a",
  surface: "#111111",
  surface2: "#1a1a1a",
  border: "#2a2a2a",
  text: "#e8e8e8",
  muted: "#888888",
  accent: "#ff4d5e",
};

export interface Trainer {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  plan: Plan;
  theme: TrainerTheme;
  created_at: string;
}

export interface Student {
  id: string;
  trainer_id: string;
  name: string;
  slug: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  level: "iniciante" | "intermediário" | "avançado" | null;
  active: boolean;
  created_at: string;
}

export interface TrainingPlan {
  id: string;
  student_id: string;
  trainer_id: string;
  division_type: string;
  total_weeks: number;
  sessions_per_week: number | null;
  active: boolean;
  created_at: string;
}

export interface WorkoutDay {
  id: string;
  plan_id: string;
  day_code: string;
  label: string;
  focus: string | null;
  warmup: string | null;
  day_order: number;
}

export type VideoType = "system" | "custom" | "external";

export interface Exercise {
  id: string;
  workout_day_id: string;
  name: string;
  type: "compound" | "cluster" | "isolation";
  cluster_block: string | null;
  rest_time: string | null;
  notes: string | null;
  exercise_order: number;
  video_url: string | null;
  video_type: VideoType | null;
  video_storage_path: string | null;
}

export interface WorkoutSession {
  id: string;
  student_id: string;
  workout_day_id: string;
  week_number: number;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
}

export interface SetRecord {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  recorded_at: string;
}

// In-progress workout state persisted in localStorage
export interface ActiveSet {
  weight: string;
  reps: string;
  completed: boolean;
}

export interface ActiveExercise {
  exercise_id: string;
  sets: ActiveSet[];
}

export interface WorkoutState {
  session_id: string | null;
  student_id: string;
  workout_day_id: string;
  week_number: number;
  started_at: string;
  exercises: ActiveExercise[];
  current_exercise_index: number;
  completed: boolean;
}

export interface PeriodizationWeek {
  id: string;
  plan_id: string;
  week_number: number;
  sets_range: string;
  reps_range: string;
  is_cluster: boolean;
  volume_label: string | null;
  intensity_label: string | null;
  observation: string | null;
}

export type DivisionType =
  | "PPL"
  | "ABC"
  | "ABCDE"
  | "AB"
  | "Full Body"
  | "Custom";

export interface DivisionTemplate {
  type: DivisionType;
  label: string;
  sessions: number;
  days: { code: string; label: string; focus: string }[];
}

export const DIVISION_TEMPLATES: DivisionTemplate[] = [
  {
    type: "PPL",
    label: "PPL × 2 (Push / Pull / Legs)",
    sessions: 6,
    days: [
      {
        code: "push-a",
        label: "Push A",
        focus: "Peito / Ombro / Tríceps — Foco Peito",
      },
      {
        code: "pull-a",
        label: "Pull A",
        focus: "Costas / Bíceps — Foco Costas",
      },
      { code: "legs-a", label: "Legs A", focus: "Quadríceps / Panturrilha" },
      {
        code: "push-b",
        label: "Push B",
        focus: "Ombro / Peito / Tríceps — Foco Ombro",
      },
      {
        code: "pull-b",
        label: "Pull B",
        focus: "Costas / Bíceps — Foco Bíceps",
      },
      { code: "legs-b", label: "Legs B", focus: "Posterior de Coxa / Glúteos" },
    ],
  },
  {
    type: "ABC",
    label: "ABC (3 dias)",
    sessions: 3,
    days: [
      { code: "A", label: "Treino A", focus: "Peito / Tríceps / Ombro" },
      { code: "B", label: "Treino B", focus: "Costas / Bíceps" },
      { code: "C", label: "Treino C", focus: "Pernas / Abdômen" },
    ],
  },
  {
    type: "ABCDE",
    label: "ABCDE (5 dias)",
    sessions: 5,
    days: [
      { code: "A", label: "Treino A", focus: "Peito" },
      { code: "B", label: "Treino B", focus: "Costas" },
      { code: "C", label: "Treino C", focus: "Ombro" },
      { code: "D", label: "Treino D", focus: "Pernas" },
      { code: "E", label: "Treino E", focus: "Bíceps / Tríceps" },
    ],
  },
  {
    type: "AB",
    label: "AB (Upper / Lower)",
    sessions: 4,
    days: [
      { code: "upper-a", label: "Upper A", focus: "Peito / Costas / Ombro" },
      { code: "lower-a", label: "Lower A", focus: "Quadríceps / Posterior" },
      { code: "upper-b", label: "Upper B", focus: "Peito / Costas — variação" },
      {
        code: "lower-b",
        label: "Lower B",
        focus: "Glúteos / Posterior / Panturrilha",
      },
    ],
  },
  {
    type: "Full Body",
    label: "Full Body (3×/semana)",
    sessions: 3,
    days: [
      {
        code: "full-a",
        label: "Full Body A",
        focus: "Multiarticulares — foco força",
      },
      {
        code: "full-b",
        label: "Full Body B",
        focus: "Multiarticulares — foco volume",
      },
      {
        code: "full-c",
        label: "Full Body C",
        focus: "Multiarticulares — foco intensidade",
      },
    ],
  },
  {
    type: "Custom",
    label: "Personalizado",
    sessions: 0,
    days: [],
  },
];

export const DEFAULT_PERIODIZATION = (
  totalWeeks: number,
): Omit<PeriodizationWeek, "id" | "plan_id">[] => {
  const base = [
    {
      week_number: 1,
      sets_range: "2",
      reps_range: "10–15",
      is_cluster: false,
      volume_label: "Deload",
      intensity_label: "Baixa",
      observation: "Adaptação / diagnóstico de carga",
    },
    {
      week_number: 2,
      sets_range: "2–3",
      reps_range: "10–15",
      is_cluster: false,
      volume_label: "Baixo",
      intensity_label: "Média",
      observation: "Aclimatação ao programa",
    },
    {
      week_number: 3,
      sets_range: "3",
      reps_range: "8–12",
      is_cluster: false,
      volume_label: "Médio",
      intensity_label: "Média",
      observation: "Início da progressão",
    },
    {
      week_number: 4,
      sets_range: "4",
      reps_range: "6–10",
      is_cluster: false,
      volume_label: "Médio-Alto",
      intensity_label: "Alta",
      observation: "Aumento de carga absoluta",
    },
    {
      week_number: 5,
      sets_range: "4–5",
      reps_range: "5–9",
      is_cluster: true,
      volume_label: "Alto",
      intensity_label: "Alta",
      observation: "Cluster Sets em todos compostos",
    },
    {
      week_number: 6,
      sets_range: "2",
      reps_range: "10–15",
      is_cluster: false,
      volume_label: "Deload",
      intensity_label: "Baixa",
      observation: "Fase regenerativa obrigatória",
    },
    {
      week_number: 7,
      sets_range: "4",
      reps_range: "6–10",
      is_cluster: false,
      volume_label: "Médio-Alto",
      intensity_label: "Alta",
      observation: "Retorno com mais carga que S4",
    },
    {
      week_number: 8,
      sets_range: "5",
      reps_range: "5–9",
      is_cluster: true,
      volume_label: "Alto",
      intensity_label: "Alta",
      observation: "Supercompensação",
    },
    {
      week_number: 9,
      sets_range: "6",
      reps_range: "5–9",
      is_cluster: true,
      volume_label: "Super Alto",
      intensity_label: "Média",
      observation: "Volume máximo do ciclo",
    },
    {
      week_number: 10,
      sets_range: "3",
      reps_range: "3–7",
      is_cluster: false,
      volume_label: "Médio",
      intensity_label: "Alta",
      observation: "Intensidade peak com menos séries",
    },
    {
      week_number: 11,
      sets_range: "4",
      reps_range: "3–7",
      is_cluster: false,
      volume_label: "Alto",
      intensity_label: "Alta",
      observation: "Consolidação de força",
    },
    {
      week_number: 12,
      sets_range: "3",
      reps_range: "3–7",
      is_cluster: false,
      volume_label: "Deload",
      intensity_label: "Baixa",
      observation: "Deload final — prepare o próximo ciclo",
    },
  ];
  return base.slice(0, totalWeeks);
};
