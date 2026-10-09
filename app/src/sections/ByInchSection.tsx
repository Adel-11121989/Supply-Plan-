import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { WorkspaceData } from '@/types/workspace';
import { fmtInt } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

const BLUE = '#4f6bed';
const GREEN = '#1f9d74';

export function ByInchSection({ data }: { data: WorkspaceData }) {
  const [inch, setInch] = useState('all');
  const [modelQ, setModelQ] = useState('');

  const inches = useMemo(
    () => Array.from(new Set(data.models.filter((m) => m.planQty > 0).map((m) => m.inch))).sort((a, b) => a - b),
    [data.models],
  );

  const rows = useMemo(() => {
    const needle = modelQ.trim().toLowerCase();
    return data.models
      .filter((m) => m.planQty > 0)
      .filter((m) => inch === 'all' || m.inch === Number(inch))
      .filter((m) => !needle || m.model.toLowerCase().includes(needle) || m.fgCode.toLowerCase().includes(needle))
      .map((m) => ({
        name: `${m.model} / ${m.country} / ${m.version}`,
        Planned: m.planQty,
        Recorded: m.recordedQty,
      }))
      .sort((a, b) => b.Planned - a.Planned);
  }, [data.models, inch, modelQ]);

  const byInch = useMemo(() => {
    const map = new Map<number, { planned: number; recorded: number; models: number }>();
    for (const m of data.models) {
      if (m.planQty <= 0) continue;
      const cur = map.get(m.inch) ?? { planned: 0, recorded: 0, models: 0 };
      cur.planned += m.planQty; cur.recorded += m.recordedQty; cur.models++;
      map.set(m.inch, cur);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [data.models]);

  const planned = rows.reduce((a, r) => a + r.Planned, 0);
  const recorded = rows.reduce((a, r) => a + r.Recorded, 0);
  const completion = planned > 0 ? (recorded / planned) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#16233b]">Production volume by model &amp; inch</h2>
          <p className="text-sm text-[#64748f]">Compare the full month plan with recorded production.</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={inch} onValueChange={setInch}>
            <SelectTrigger className="h-8 w-[160px] border-[#d7dcea] text-sm text-[#3c4a63]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All screen sizes</SelectItem>
              {inches.map((i) => <SelectItem key={i} value={String(i)}>{i} inch</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative">
            <Input value={modelQ} onChange={(e) => setModelQ(e.target.value)} placeholder="All models"
              className="h-8 w-[200px] border-[#d7dcea] pr-8 text-sm" />
            {modelQ && (
              <button onClick={() => setModelQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a97b1] hover:text-[#3c4a63]">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-8 rounded-xl border border-[#dbe4fb] bg-[#eef2ff] px-5 py-4">
        <div><span className="text-[26px] font-bold text-[#3f5ad9]">{fmtInt(planned)}</span><span className="ml-1.5 text-sm text-[#64748f]">planned TVs</span></div>
        <div><span className="text-[26px] font-bold text-[#3f5ad9]">{fmtInt(recorded)}</span><span className="ml-1.5 text-sm text-[#64748f]">recorded TVs</span></div>
        <div><span className="text-[26px] font-bold text-[#3f5ad9]">{completion.toFixed(1)}%</span><span className="ml-1.5 text-sm text-[#64748f]">completion</span></div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-[#e4e8f2] bg-white p-5 shadow-[0_1px_2px_rgba(22,35,59,0.05)] xl:col-span-2">
          <h3 className="mb-3 text-[15px] font-semibold text-[#16233b]">Production volume by model</h3>
          <div style={{ height: Math.max(280, rows.length * 46) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 24, left: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e9edf6" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#8a97b1' }} tickFormatter={(v: number) => fmtInt(v)} />
                <YAxis type="category" dataKey="name" width={210} tick={{ fontSize: 10.5, fill: '#64748f' }} />
                <Tooltip formatter={(v: number, name: string) => [`${fmtInt(v)} TVs`, name]} cursor={{ fill: 'rgba(79,107,237,0.06)' }} />
                <Legend iconType="square" iconSize={10} formatter={(v: string) => <span className="text-xs text-[#64748f]">{v}</span>} />
                <Bar dataKey="Planned" fill={BLUE} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false} />
                <Bar dataKey="Recorded" fill={GREEN} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {rows.length === 0 && <div className="py-10 text-center text-sm text-[#8a97b1]">No models match this filter.</div>}
        </div>

        <div className="rounded-xl border border-[#e4e8f2] bg-white p-5 shadow-[0_1px_2px_rgba(22,35,59,0.05)]">
          <h3 className="mb-1 text-[15px] font-semibold text-[#16233b]">By screen size</h3>
          <p className="mb-3 text-xs text-[#8a97b1]">Planned volume share per inch</p>
          <div className="space-y-3">
            {byInch.map(([i, v]) => {
              const total = byInch.reduce((a, [, x]) => a + x.planned, 0) || 1;
              const pct = (v.planned / total) * 100;
              return (
                <button key={i} onClick={() => setInch(String(i) === inch ? 'all' : String(i))} className="block w-full text-left">
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-[#16233b]">{i}&Prime;</span>
                    <span className="font-mono-num text-xs text-[#64748f]">{fmtInt(v.planned)} TVs · {v.models} models</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#eef1f8]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: String(i) === inch ? '#3f5ad9' : BLUE }} />
                  </div>
                </button>
              );
            })}
            {byInch.length === 0 && <div className="py-6 text-center text-sm text-[#8a97b1]">No planned models.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
