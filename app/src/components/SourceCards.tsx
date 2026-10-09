import type { WorkspaceSources } from '@/types/workspace';
import { fmtCairo } from '@/lib/format';
import { Database, Boxes, Truck, CalendarRange } from 'lucide-react';

const CARDS: { key: keyof WorkspaceSources; label: string; icon: typeof Database }[] = [
  { key: 'bom', label: 'BOM', icon: Database },
  { key: 'stock', label: 'Opening Stock', icon: Boxes },
  { key: 'sn', label: 'SN / New Deliveries', icon: Truck },
  { key: 'plan', label: 'Monthly Plan', icon: CalendarRange },
];

export function SourceCards({ sources, onPick }: { sources: WorkspaceSources; onPick: (k: keyof WorkspaceSources) => void }) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onPick(key)}
          className="group rounded-xl border border-[#e4e8f2] bg-white p-4 text-left shadow-[0_1px_2px_rgba(22,35,59,0.05)] transition hover:border-[#b9c6ee] hover:shadow-[0_4px_14px_rgba(79,107,237,0.12)]"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-[#4f6bed]" />
            <span className="text-[15px] font-semibold text-[#16233b]">{label}</span>
          </div>
          <div className="mt-1.5 text-xs text-[#7c8aa5]">
            Last update: {fmtCairo(sources[key].updatedAt)}
          </div>
        </button>
      ))}
    </div>
  );
}
