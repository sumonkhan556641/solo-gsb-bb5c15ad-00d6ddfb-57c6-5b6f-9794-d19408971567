export interface Material {
  name: string;
  oxides: Record<string, number>;
  min: number;
  max: number;
  disabled: boolean;
}

export interface SolveInput {
  target: Record<string, number>;
  materials: Material[];
}

export interface RecipeItem {
  name: string;
  amount: number;
  min: number;
  max: number;
  disabled: boolean;
}

export interface SolveResponse {
  status: "ok" | "conflict" | "error";
  conflicts: string[];
  notes: string[];
  oxides: string[];
  recipe: RecipeItem[];
  target: Record<string, number>;
  computed: Record<string, number>;
  deviation: Record<string, number>;
  residual: number | null;
  exact: boolean;
}
