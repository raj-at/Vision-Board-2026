
export type VisualVibe = 'Minimal' | 'Cinematic' | 'Cozy' | 'Luxury' | 'Nature' | 'Futuristic' | 'Street' | 'Corporate';
export type ImageStyle = 'photoreal' | 'illustration' | 'collage' | 'paper cut' | '3D';
export type PinColor = 'red' | 'blue' | 'yellow' | 'green';
export type CardColor = 'cream' | 'white' | 'pastel-blue' | 'pastel-green' | 'pastel-pink' | 'pastel-yellow';

export interface CategoryData {
  id: string;
  name: string;
  vision_line: string;
  micro_plan_line: string;
  habit_card: string;
  milestone_card: string;
  milestone_date: string;
  image_prompt: string;
  image_url?: string;
  quote?: string;
  priority: number;
  confidence: number;
}

export interface BoardBlueprint {
  board_title: string;
  theme_words: string[];
  summary: string;
  identity_statements: string[];
  categories: CategoryData[];
  next_7_days: string[];
}

export interface UserAnswers {
  title2026: string;
  themeWords: string[];
  identityGoal: string;
  selectedCategories: string[];
  categoryDetails: Record<string, {
    outcome: string;
    why: string;
    habit: string;
    obstacle: string;
    support: string;
    priority: number;
    confidence: number;
  }>;
  weeklyHours: number;
  protectionList: string;
  sayNoTo: string;
  perfectDay: string;
  targetEmotion: string;
  fearToOutgrow: string;
  visualVibe: VisualVibe;
  layoutStyle: 'clean' | 'messy';
  imageStyle: ImageStyle;
  avoidColors: string;
}

export interface PinItem {
  id: string;
  type: 'vision' | 'plan' | 'habit' | 'milestone' | 'image' | 'quote' | 'identity' | 'summary' | 'action';
  content: string;
  title?: string;
  date?: string;
  imageUrl?: string;
  x: number;
  y: number;
  rotation: number;
  pinColor: PinColor;
  cardColor: CardColor;
  width: number;
  height: number;
  category?: string;
}
