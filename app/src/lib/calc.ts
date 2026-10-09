import type {
  WorkspaceData,
  MaterialStat,
  ModelStat,
  WorkspaceStats,
} from '@/types/workspace';
import { modelKey } from '@/types/workspace';

export interface ComputeOptions {
  /** 1..31 — when set, demand is cumulative plan up to & including this day */
  day?: number | null;
  /** restrict the calculation to models of this inch size */
  inch?: number | null;
}

/**
 * Core PSI engine.
 *   demand    = Σ (model qty × BOM qty per unit)
 *   balance   = opening stock + SN − demand
 *   shortage  = balance < 0
 *   coverage  = % of required material codes without a shortage
 */
export function computeWorkspace(data: WorkspaceData, opts: ComputeOptions = {}): WorkspaceStats {
  const day = opts.day ?? null;
  const inch = opts.inch ?? null;

  const activeModels = data.models.filter(
    (m) => m.planQty > 0 && (inch == null || m.inch === inch),
  );
  const activeKeys = new Set(activeModels.map(modelKey));

  // effective qty per model (full month, or cumulative up to selected day)
  const effQty = new Map<string, number>();
  for (const m of activeModels) {
    if (day == null) effQty.set(modelKey(m), m.planQty);
    else effQty.set(modelKey(m), (m.daily ?? []).slice(0, day).reduce((a, b) => a + b, 0));
  }

  const matByCode = new Map(data.materials.map((m) => [m.code, m]));
  const reqMap = new Map<string, number>();
  const traceMap = new Map<string, { modelKey: string; qty: number }[]>();
  const modelBomCount = new Map<string, number>();

  for (const line of data.bom) {
    if (!activeKeys.has(line.modelKey)) continue;
    modelBomCount.set(line.modelKey, (modelBomCount.get(line.modelKey) ?? 0) + 1);
    const q = effQty.get(line.modelKey) ?? 0;
    if (q <= 0) continue;
    const add = q * line.qtyPerUnit;
    reqMap.set(line.materialCode, (reqMap.get(line.materialCode) ?? 0) + add);
    const arr = traceMap.get(line.materialCode) ?? [];
    const ex = arr.find((t) => t.modelKey === line.modelKey);
    if (ex) ex.qty += add;
    else arr.push({ modelKey: line.modelKey, qty: add });
    traceMap.set(line.materialCode, arr);
  }

  const materialStats: MaterialStat[] = [];
  for (const [code, required] of reqMap) {
    const material = matByCode.get(code);
    if (!material) continue;
    const available = material.openingStock + material.snQty;
    const balance = available - required;
    materialStats.push({
      material,
      required,
      available,
      balance,
      short: balance < -1e-9,
      demandByModel: (traceMap.get(code) ?? []).sort((a, b) => b.qty - a.qty),
      modelsUsing: (traceMap.get(code) ?? []).length,
    });
  }
  materialStats.sort((a, b) => a.balance - b.balance);

  const requiredSkus = materialStats.length;
  const shortSkus = materialStats.filter((s) => s.short).length;
  const coveredSkus = requiredSkus - shortSkus;

  const shortSet = new Set(materialStats.filter((s) => s.short).map((s) => s.material.code));
  const modelStats: ModelStat[] = data.models.map((m) => {
    const key = modelKey(m);
    const lines = data.bom.filter((l) => l.modelKey === key);
    const exposed = lines.some((l) => shortSet.has(l.materialCode));
    return {
      model: m,
      key,
      bomLines: lines.length,
      bomMapped: lines.length > 0,
      exposed,
    };
  });

  const plannedTvs = activeModels.reduce((a, m) => a + m.planQty, 0);
  const recordedTvs = data.models.reduce((a, m) => a + m.recordedQty, 0);

  return {
    plannedTvs,
    recordedTvs,
    plannedModels: data.models.filter((m) => m.planQty > 0).length,
    materialStats,
    requiredSkus,
    coveredSkus,
    shortSkus,
    coveragePct: requiredSkus ? (coveredSkus / requiredSkus) * 100 : 100,
    modelsExposed: modelStats.filter((m) => m.exposed && m.model.planQty > 0).length,
    modelStats,
    bomRelationships: data.bom.length,
    uniqueMaterials: new Set(data.bom.map((l) => l.materialCode)).size,
    noStockRowCount: data.materials.filter((m) => m.openingStock === 0 && m.snQty === 0).length,
  };
}
