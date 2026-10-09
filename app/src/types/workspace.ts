export interface ModelPlan {
  model: string;
  fgCode: string;
  country: string;
  version: string;
  planQty: number;
  recordedQty: number;
  inch: number;
  /** 31 entries: planned units per calendar day of the month */
  daily: number[];
}

export interface Material {
  code: string;
  description: string;
  location: string;
  type: string; // ROH | HALB ...
  unit: string; // EA | KG | G | M ...
  openingStock: number;
  snQty: number;
}

export interface BomLine {
  modelKey: string; // `${model}|${fgCode}`
  materialCode: string;
  qtyPerUnit: number;
}

export interface SourceMeta {
  name: string;
  updatedAt: string; // ISO
  rows: number;
}

export interface WorkspaceSources {
  bom: SourceMeta;
  stock: SourceMeta;
  sn: SourceMeta;
  plan: SourceMeta;
}

export interface WorkspaceData {
  monthLabel: string; // e.g. "October 2026"
  sources: WorkspaceSources;
  models: ModelPlan[];
  materials: Material[];
  bom: BomLine[];
}

export const modelKey = (m: Pick<ModelPlan, 'model' | 'fgCode'>) => `${m.model}|${m.fgCode}`;

/** Result of running the shortage calculation over a workspace. */
export interface MaterialStat {
  material: Material;
  required: number;
  available: number;
  balance: number;
  short: boolean;
  /** per-model demand contribution, for the trace dialog */
  demandByModel: { modelKey: string; qty: number }[];
  modelsUsing: number;
}

export interface ModelStat {
  model: ModelPlan;
  key: string;
  bomLines: number;
  bomMapped: boolean;
  exposed: boolean;
}

export interface WorkspaceStats {
  plannedTvs: number;
  recordedTvs: number;
  plannedModels: number;
  materialStats: MaterialStat[];
  requiredSkus: number;
  coveredSkus: number;
  shortSkus: number;
  coveragePct: number;
  modelsExposed: number;
  modelStats: ModelStat[];
  bomRelationships: number;
  uniqueMaterials: number;
  noStockRowCount: number;
}
