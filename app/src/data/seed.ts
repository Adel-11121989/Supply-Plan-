import type { WorkspaceData } from '@/types/workspace';
import raw from './seed.json';

export const SEED_WORKSPACE: WorkspaceData = raw as unknown as WorkspaceData;

export const EMPTY_WORKSPACE: WorkspaceData = {
  monthLabel: SEED_WORKSPACE.monthLabel,
  sources: {
    bom: { name: '—', updatedAt: new Date().toISOString(), rows: 0 },
    stock: { name: '—', updatedAt: new Date().toISOString(), rows: 0 },
    sn: { name: '—', updatedAt: new Date().toISOString(), rows: 0 },
    plan: { name: '—', updatedAt: new Date().toISOString(), rows: 0 },
  },
  models: [],
  materials: [],
  bom: [],
};
