import { useMemo, useRef, useState } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { computeWorkspace } from '@/lib/calc';
import type { WorkspaceSources } from '@/types/workspace';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { SourceCards } from '@/components/SourceCards';
import { MonthBar } from '@/components/MonthBar';
import { Overview } from '@/sections/Overview';
import { PlanSection } from '@/sections/PlanSection';
import { ByInchSection } from '@/sections/ByInchSection';
import { MaterialsSection } from '@/sections/MaterialsSection';
import { CalcSection } from '@/sections/CalcSection';
import { Warehouse, CalendarRange, Ruler, Boxes, HelpCircle } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Shortage overview', icon: Warehouse },
  { id: 'plan', label: 'Production plan', icon: CalendarRange },
  { id: 'inch', label: 'By Inch', icon: Ruler },
  { id: 'materials', label: 'Material inputs', icon: Boxes },
  { id: 'calc', label: 'Calculation & data', icon: HelpCircle },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function Home() {
  const ws = useWorkspace();
  const stats = useMemo(() => computeWorkspace(ws.data), [ws.data]);
  const [tab, setTab] = useState<TabId>(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    return (TABS.some((x) => x.id === t) ? t : 'overview') as TabId;
  });
  const importRef = useRef<HTMLInputElement>(null);

  const onPickSource = (_key: keyof WorkspaceSources) => importRef.current?.click();

  return (
    <div className="min-h-screen bg-[#f3f5fa]">
      <Header />
      <main className="mx-auto max-w-[1400px] px-5 py-6">
        <Hero ws={ws} fileRef={importRef} />
        <SourceCards sources={ws.data.sources} onPick={onPickSource} />
        <MonthBar monthLabel={ws.data.monthLabel} savedAt={ws.savedAt} onNewWorkspace={ws.newWorkspace} />

        <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-[#e4e8f2]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                tab === t.id
                  ? 'border-[#4f6bed] text-[#4f6bed]'
                  : 'border-transparent text-[#64748f] hover:text-[#16233b]'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
          <span className="ml-auto pb-1 text-xs text-[#8a97b1]">
            {stats.plannedModels} planned models
          </span>
        </div>

        {tab === 'overview' && <Overview data={ws.data} stats={stats} />}
        {tab === 'plan' && <PlanSection data={ws.data} stats={stats} ws={ws} />}
        {tab === 'inch' && <ByInchSection data={ws.data} />}
        {tab === 'materials' && <MaterialsSection data={ws.data} ws={ws} />}
        {tab === 'calc' && <CalcSection data={ws.data} stats={stats} ws={ws} />}

        <footer className="mt-10 border-t border-[#e4e8f2] pt-4 pb-8 text-center text-xs text-[#9aa7bf]">
          SupplyPlan · Materials PSI workspace — data is stored in this browser only.
        </footer>
      </main>
    </div>
  );
}
