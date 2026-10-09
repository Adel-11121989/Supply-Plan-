import { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import type { WorkspaceData, BomLine, Material, ModelPlan } from '@/types/workspace';
import { SEED_WORKSPACE, EMPTY_WORKSPACE } from '@/data/seed';
import { nowIso } from '@/lib/format';

const LS_KEY = 'supplyplan-workspace-v1';
const LS_SAVED = 'supplyplan-saved-at-v1';

export interface ImportSummary {
  sheet: string;
  rows: number;
  applied: string;
}

function loadInitial(): { data: WorkspaceData; savedAt: string | null; fromStore: boolean } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const savedAt = localStorage.getItem(LS_SAVED);
    if (raw) return { data: JSON.parse(raw) as WorkspaceData, savedAt, fromStore: true };
  } catch {
    /* corrupted store -> fall back to seed */
  }
  return { data: SEED_WORKSPACE, savedAt: null, fromStore: false };
}

export function useWorkspace() {
  const initial = useMemo(loadInitial, []);
  const [data, setData] = useState<WorkspaceData>(initial.data);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(initial.savedAt);

  const markDirty = useCallback((updater: (d: WorkspaceData) => WorkspaceData) => {
    setData((d) => updater(d));
    setDirty(true);
  }, []);

  const save = useCallback(() => {
    const iso = nowIso();
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    localStorage.setItem(LS_SAVED, iso);
    setSavedAt(iso);
    setDirty(false);
  }, [data]);

  const resetAll = useCallback(() => {
    setData(SEED_WORKSPACE);
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_SAVED);
    setSavedAt(null);
    setDirty(false);
  }, []);

  const newWorkspace = useCallback(() => {
    setData({ ...EMPTY_WORKSPACE, sources: {
      bom: { name: '—', updatedAt: nowIso(), rows: 0 },
      stock: { name: '—', updatedAt: nowIso(), rows: 0 },
      sn: { name: '—', updatedAt: nowIso(), rows: 0 },
      plan: { name: '—', updatedAt: nowIso(), rows: 0 },
    }});
    setDirty(true);
  }, []);

  const updatePlanQty = useCallback(
    (key: string, qty: number) =>
      markDirty((d) => ({
        ...d,
        models: d.models.map((m) =>
          `${m.model}|${m.fgCode}` === key
            ? { ...m, planQty: Math.max(0, Math.round(qty)), daily: spreadDaily(Math.max(0, Math.round(qty)), m.daily) }
            : m,
        ),
      })),
    [markDirty],
  );

  const updateMaterial = useCallback(
    (code: string, patch: Partial<Pick<Material, 'openingStock' | 'snQty'>>) =>
      markDirty((d) => ({
        ...d,
        materials: d.materials.map((m) => (m.code === code ? { ...m, ...patch } : m)),
      })),
    [markDirty],
  );

  /** Export the whole workspace as a multi-sheet xlsx workbook. */
  const exportWorkbook = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const plans = data.models.map((m) => ({
      'FG code': m.fgCode, Model: m.model, Country: m.country, Version: m.version,
      Inch: m.inch, [data.monthLabel]: m.planQty, Recorded: m.recordedQty,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(plans), 'Plans');
    const bomRows = data.bom.map((b) => ({
      'Model key': b.modelKey, 'Material code': b.materialCode, 'Required Qty': b.qtyPerUnit,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bomRows), 'BOM');
    const stock = data.materials.map((m) => ({
      'Material code': m.code, Description: m.description, Location: m.location,
      Type: m.type, Unit: m.unit, 'Opening stock': m.openingStock,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stock), 'Opening Stock');
    const sn = data.materials.filter((m) => m.snQty > 0).map((m) => ({
      'Material code': m.code, 'Request Qty': m.snQty,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sn), 'SN');
    XLSX.writeFile(wb, `SupplyPlan_${data.monthLabel.replace(/\s+/g, '_')}.xlsx`);
  }, [data]);

  /**
   * Import an xlsx workbook. Sheets matched by name keywords:
   * plan / bom / stock|balance / sn|deliver — each found sheet replaces that input only.
   */
  const importWorkbook = useCallback(async (file: File): Promise<ImportSummary[]> => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const summaries: ImportSummary[] = [];
    const norm = (s: string) => s.toLowerCase();
    const pick = (...keys: string[]) =>
      wb.SheetNames.find((n) => keys.some((k) => norm(n).includes(k)));

    let next = { ...data };
    const now = nowIso();

    const planSheet = pick('plan');
    if (planSheet) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[planSheet]);
      const models: ModelPlan[] = [];
      for (const r of rows) {
        const fg = String(r['FG code'] ?? r['fgCode'] ?? '').trim();
        const model = String(r['Model'] ?? r['model'] ?? '').trim();
        if (!fg || !model) continue;
        const monthKey = Object.keys(r).find((k) => /20\d\d/.test(k) && !/record/i.test(k));
        const planQty = Number(r[monthKey ?? ''] ?? 0) || 0;
        const inch = Number(r['Inch'] ?? 0) || parseInt(model.slice(1, 3), 10) || 0;
        const prev = next.models.find((m) => m.fgCode === fg && m.model === model);
        models.push({
          model, fgCode: fg,
          country: String(r['Country'] ?? ''), version: String(r['Version'] ?? 'TV01'),
          inch, planQty, recordedQty: Number(r['Recorded'] ?? 0) || 0,
          daily: spreadDaily(planQty, prev?.daily),
        });
      }
      next = { ...next, models };
      next.sources = { ...next.sources, plan: { name: file.name, updatedAt: now, rows: models.length } };
      summaries.push({ sheet: planSheet, rows: models.length, applied: 'Monthly Plan' });
    }

    const bomSheet = pick('bom');
    if (bomSheet) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[bomSheet]);
      const bom: BomLine[] = [];
      for (const r of rows) {
        const mk = String(r['Model key'] ?? '').trim();
        const code = String(r['Material code'] ?? '').trim();
        const qty = Number(r['Required Qty'] ?? 0);
        if (mk && code && qty > 0) bom.push({ modelKey: mk, materialCode: code, qtyPerUnit: qty });
      }
      next = { ...next, bom };
      next.sources = { ...next.sources, bom: { name: file.name, updatedAt: now, rows: bom.length } };
      summaries.push({ sheet: bomSheet, rows: bom.length, applied: 'BOM' });
    }

    const stockSheet = pick('stock', 'balance', 'opening');
    if (stockSheet) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[stockSheet]);
      let count = 0;
      const materials = [...next.materials];
      const idx = new Map(materials.map((m, i) => [m.code, i]));
      for (const r of rows) {
        const code = String(r['Material code'] ?? '').trim();
        if (!code) continue;
        const openingStock = Number(r['Opening stock'] ?? 0) || 0;
        const at = idx.get(code);
        if (at != null) materials[at] = { ...materials[at], openingStock };
        else {
          idx.set(code, materials.length);
          materials.push({
            code, description: String(r['Description'] ?? ''), location: String(r['Location'] ?? ''),
            type: String(r['Type'] ?? 'ROH'), unit: String(r['Unit'] ?? 'EA'), openingStock, snQty: 0,
          });
        }
        count++;
      }
      next = { ...next, materials };
      next.sources = { ...next.sources, stock: { name: file.name, updatedAt: now, rows: count } };
      summaries.push({ sheet: stockSheet, rows: count, applied: 'Opening Stock' });
    }

    const snSheet = pick('sn', 'deliver');
    if (snSheet) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[snSheet]);
      let count = 0;
      const materials = [...next.materials];
      const idx = new Map(materials.map((m, i) => [m.code, i]));
      const acc = new Map<string, number>();
      for (const r of rows) {
        const code = String(r['Material code'] ?? '').trim();
        const qty = Number(r['Request Qty'] ?? 0) || 0;
        if (code && qty) acc.set(code, (acc.get(code) ?? 0) + qty);
      }
      for (const [code, qty] of acc) {
        const at = idx.get(code);
        if (at != null) materials[at] = { ...materials[at], snQty: qty };
        count++;
      }
      next = { ...next, materials };
      next.sources = { ...next.sources, sn: { name: file.name, updatedAt: now, rows: count } };
      summaries.push({ sheet: snSheet, rows: count, applied: 'SN / New Deliveries' });
    }

    setData(next);
    setDirty(true);
    return summaries;
  }, [data]);

  // keep a safety autosave-free approach: nothing persists until "Save changes"
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  return {
    data, dirty, savedAt,
    save, resetAll, newWorkspace,
    updatePlanQty, updateMaterial,
    exportWorkbook, importWorkbook,
  };
}

/** Redistribute a new total over 31 days keeping the existing daily shape. */
function spreadDaily(total: number, prev?: number[]): number[] {
  const base = prev && prev.length === 31 ? prev : Array.from({ length: 31 }, (_, i) => (i % 7 === 3 ? 0 : 1));
  const sum = base.reduce((a, b) => a + b, 0) || 1;
  const raw = base.map((w) => (total * w) / sum);
  const ints = raw.map(Math.floor);
  let rem = total - ints.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - ints[i], i] as const).sort((a, b) => b[0] - a[0]);
  for (let i = 0; i < order.length && rem > 0; i++, rem--) ints[order[i][1]]++;
  return ints;
}

export type WorkspaceApi = ReturnType<typeof useWorkspace>;
