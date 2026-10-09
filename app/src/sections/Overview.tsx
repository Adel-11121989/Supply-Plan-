import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { WorkspaceData, WorkspaceStats, MaterialStat } from '@/types/workspace';
import { computeWorkspace } from '@/lib/calc';
import { fmtInt, fmtQty } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarCheck2, FileDown, PackageX, PackageCheck, AlertTriangle, Tv, X } from 'lucide-react';

const BLUE = '#4f6bed';
const GREEN = '#1f9d74';
const RED = '#e2674f';

export function Overview({ data, stats }: { data: WorkspaceData; stats: WorkspaceStats }) {
  const [inchFilter, setInchFilter] = useState<string>('all');
  const [shortOnly, setShortOnly] = useState(true);
  const [locFilter, setLocFilter] = useState<string>('all');
  const [day, setDay] = useState<number | null>(null);
  const [trace, setTrace] = useState<MaterialStat | null>(null);

  const inches = useMemo(
    () => Array.from(new Set(data.models.filter((m) => m.planQty > 0).map((m) => m.inch))).sort((a, b) => a - b),
    [data.models],
  );
  const locations = useMemo(
    () => Array.from(new Set(stats.materialStats.map((s) => s.material.location).filter(Boolean))).sort(),
    [stats.materialStats],
  );

  // table scope: full stats for KPIs/charts, scoped stats for the shortage list
  const scoped = useMemo(
    () => (day == null && inchFilter === 'all')
      ? stats
      : computeWorkspace(data, { day, inch: inchFilter === 'all' ? null : Number(inchFilter) }),
    [data, day, inchFilter, stats],
  );

  const rows = useMemo(() => {
    let r = scoped.materialStats;
    if (shortOnly) r = r.filter((s) => s.short);
    if (locFilter !== 'all') r = r.filter((s) => s.material.location === locFilter);
    return r;
  }, [scoped.materialStats, shortOnly, locFilter]);

  const topModels = useMemo(
    () => [...data.models].filter((m) => m.planQty > 0).sort((a, b) => b.planQty - a.planQty).slice(0, 7),
    [data.models],
  );

  const exportCsv = () => {
    const head = ['Material code', 'Description', 'Location', 'Unit', 'Available', 'Total required', 'Net balance', 'Status'];
    const lines = rows.map((s) => [
      s.material.code, `"${s.material.description.replace(/"/g, '""')}"`, s.material.location,
      s.material.unit, s.available, Math.round(s.required * 1000) / 1000,
      Math.round(s.balance * 1000) / 1000, s.short ? 'Short' : 'Covered',
    ].join(','));
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `shortage_${data.monthLabel.replace(/\s+/g, '_')}${day ? `_day${day}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const kpis = [
    { label: 'Production plan', value: fmtInt(stats.plannedTvs), unit: 'TVs', sub: `${fmtInt(stats.plannedTvs)} with BOM mapping`, icon: Tv, tint: 'bg-[#eef2ff] text-[#4f6bed]' },
    { label: 'Materials short', value: fmtInt(stats.shortSkus), unit: 'SKUs', sub: `Across ${fmtInt(stats.requiredSkus)} materials in this scope`, icon: PackageX, tint: 'bg-[#fdeeee] text-[#e05252]' },
    { label: 'Material coverage', value: `${Math.round(stats.coveragePct)}%`, unit: '', sub: `${fmtInt(stats.coveredSkus)} of ${fmtInt(stats.requiredSkus)} required SKUs covered`, icon: PackageCheck, tint: 'bg-[#e9f7f1] text-[#1f9d74]' },
    { label: 'Models exposed', value: fmtInt(stats.modelsExposed), unit: '', sub: 'Models using a short material in this scope', icon: AlertTriangle, tint: 'bg-[#fdf4e7] text-[#d9930d]' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-[#e4e8f2] bg-white p-4 shadow-[0_1px_2px_rgba(22,35,59,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748f]">{k.label}</span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${k.tint}`}>
                <k.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[28px] font-bold leading-none text-[#16233b]">{k.value}</span>
              {k.unit && <span className="text-sm text-[#8a97b1]">{k.unit}</span>}
            </div>
            <div className="mt-1.5 text-xs text-[#8a97b1]">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="rounded-xl border border-[#e4e8f2] bg-white p-5 shadow-[0_1px_2px_rgba(22,35,59,0.05)] xl:col-span-3">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-[#16233b]">Production volume by model</h3>
              <p className="text-xs text-[#8a97b1]">Top 7 models · full month plan</p>
            </div>
            <span className="rounded-md bg-[#f1f4fb] px-2 py-1 text-xs text-[#64748f]">TV units</span>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topModels} margin={{ top: 16, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf6" />
                <XAxis dataKey="model" tick={{ fontSize: 10.5, fill: '#64748f' }} angle={-28} textAnchor="end" height={48} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#8a97b1' }} tickFormatter={(v: number) => fmtInt(v)} />
                <Tooltip formatter={(v: number) => [`${fmtInt(v)} TVs`, 'Planned']} cursor={{ fill: 'rgba(79,107,237,0.06)' }} />
                <Bar dataKey="planQty" name="BOM mapped" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex items-center gap-4 text-xs text-[#64748f]">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: BLUE }} /> BOM mapped</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#e8b04f]" /> BOM missing</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#e4e8f2] bg-white p-5 shadow-[0_1px_2px_rgba(22,35,59,0.05)] xl:col-span-2">
          <h3 className="text-[15px] font-semibold text-[#16233b]">Material coverage</h3>
          <p className="text-xs text-[#8a97b1]">Unique required SKUs · selected scope</p>
          <div className="relative h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Covered', value: stats.coveredSkus },
                    { name: 'Short', value: stats.shortSkus },
                  ]}
                  dataKey="value" innerRadius={64} outerRadius={86} startAngle={90} endAngle={-270}
                  strokeWidth={0} cornerRadius={3} isAnimationActive={false}
                >
                  <Cell fill={GREEN} />
                  <Cell fill={RED} />
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [`${fmtInt(v)} SKUs`, name]} />
                <Legend verticalAlign="bottom" iconType="square" iconSize={10}
                  formatter={(v: string) => <span className="text-xs text-[#64748f]">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
              <span className="text-[26px] font-bold text-[#16233b]">{Math.round(stats.coveragePct)}%</span>
              <span className="text-xs text-[#8a97b1]">covered</span>
            </div>
          </div>
          <div className="mt-1 flex justify-around text-center">
            <div><div className="text-sm font-semibold text-[#16233b]">{fmtInt(stats.coveredSkus)}</div><div className="text-xs text-[#8a97b1]">Covered SKUs</div></div>
            <div><div className="text-sm font-semibold text-[#e05252]">{fmtInt(stats.shortSkus)}</div><div className="text-xs text-[#8a97b1]">Short SKUs</div></div>
          </div>
        </div>
      </div>

      {/* shortage table */}
      <div className="rounded-xl border border-[#e4e8f2] bg-white shadow-[0_1px_2px_rgba(22,35,59,0.05)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#eef1f8] px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#16233b]">
              Material shortage list
              <span className="rounded-md bg-[#f1f4fb] px-1.5 py-0.5 text-xs font-medium text-[#64748f]">{fmtInt(rows.length)}</span>
            </h3>
            <p className="text-xs text-[#8a97b1]">Open a material to trace demand across all models.</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="border-[#d7dcea] text-[#3c4a63]">
                  <CalendarCheck2 className="mr-1.5 h-3.5 w-3.5" />
                  {day ? `Up to ${data.monthLabel.split(' ')[0]} ${day}` : 'Select day'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[272px] p-3" align="end">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-[#64748f]">Cumulative plan up to day</span>
                  {day != null && (
                    <button onClick={() => setDay(null)} className="flex items-center gap-1 text-xs text-[#e05252] hover:underline">
                      <X className="h-3 w-3" /> Full month
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDay(d === day ? null : d)}
                      className={`h-8 rounded-md text-xs font-medium transition ${
                        day === d ? 'bg-[#4f6bed] text-white' : 'text-[#3c4a63] hover:bg-[#eef2ff]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" className="border-[#d7dcea] text-[#3c4a63]" onClick={exportCsv}>
              <FileDown className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[#eef1f8] px-5 py-3">
          <FilterSelect label="By Inch" value={inchFilter} onChange={setInchFilter}
            options={[['all', 'All'], ...inches.map((i): [string, string] => [String(i), `${i}"`])]} />
          <label className="flex items-center gap-2 text-sm text-[#3c4a63]">
            <Switch checked={shortOnly} onCheckedChange={setShortOnly} /> Shortages only
          </label>
          <FilterSelect label="Location" value={locFilter} onChange={setLocFilter}
            options={[['all', 'All locations'], ...locations.map((l): [string, string] => [l, l])]} />
          {day != null && (
            <Badge className="bg-[#eef2ff] text-[#4f6bed] hover:bg-[#eef2ff]">
              Demand up to day {day}
            </Badge>
          )}
        </div>

        <div className="max-h-[460px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#f8fafd] text-left text-xs uppercase tracking-wide text-[#8a97b1]">
              <tr>
                <th className="px-5 py-2.5 font-medium">Material / description</th>
                <th className="px-3 py-2.5 font-medium">Location</th>
                <th className="px-3 py-2.5 text-right font-medium">Available¹</th>
                <th className="px-3 py-2.5 text-right font-medium">Total required²</th>
                <th className="px-3 py-2.5 text-right font-medium">Net balance</th>
                <th className="px-5 py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((s) => (
                <tr key={s.material.code} onClick={() => setTrace(s)}
                  className="cursor-pointer border-t border-[#f0f3fa] transition hover:bg-[#f7f9fe]">
                  <td className="px-5 py-2.5">
                    <div className="font-mono-num text-[13px] font-semibold text-[#16233b]">{s.material.code}</div>
                    <div className="max-w-[320px] truncate text-xs text-[#8a97b1]">{s.material.description || '—'}</div>
                  </td>
                  <td className="px-3 py-2.5 text-[#3c4a63]">{s.material.location || '—'}</td>
                  <td className="px-3 py-2.5 text-right font-mono-num text-[#3c4a63]">{fmtQty(s.available, s.material.unit)} <span className="text-[10px] text-[#8a97b1]">{s.material.unit}</span></td>
                  <td className="px-3 py-2.5 text-right font-mono-num text-[#3c4a63]">{fmtQty(s.required, s.material.unit)} <span className="text-[10px] text-[#8a97b1]">{s.material.unit}</span></td>
                  <td className={`px-3 py-2.5 text-right font-mono-num font-semibold ${s.balance < 0 ? 'text-[#e05252]' : 'text-[#1f9d74]'}`}>
                    {fmtQty(s.balance, s.material.unit)} <span className="text-[10px] font-normal">{s.material.unit}</span>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {s.short
                      ? <Badge className="bg-[#fdeeee] text-[#e05252] hover:bg-[#fdeeee]">Short</Badge>
                      : <Badge className="bg-[#e9f7f1] text-[#1f9d74] hover:bg-[#e9f7f1]">Covered</Badge>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[#8a97b1]">
                  No materials match this scope. {stats.requiredSkus === 0 && 'Import a workbook to populate the workspace.'}
                </td></tr>
              )}
            </tbody>
          </table>
          {rows.length > 200 && (
            <div className="border-t border-[#f0f3fa] px-5 py-2 text-xs text-[#8a97b1]">
              Showing first 200 of {fmtInt(rows.length)} rows — use Export CSV for the full list.
            </div>
          )}
        </div>
        <div className="border-t border-[#eef1f8] px-5 py-2.5 text-[11px] leading-relaxed text-[#9aa7bf]">
          ¹ Opening stock + SN. &nbsp;² Σ (model quantity × BOM Required Qty) for the selected scope.
          Quantities across different units are never added together.
        </div>
      </div>

      {/* material trace dialog */}
      <Dialog open={!!trace} onOpenChange={() => setTrace(null)}>
        <DialogContent className="sm:max-w-lg">
          {trace && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono-num">{trace.material.code}</DialogTitle>
                <DialogDescription>{trace.material.description || 'No description'} · {trace.material.location} · {trace.material.unit}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-[#f8fafd] p-2.5">
                  <div className="font-mono-num text-sm font-semibold text-[#16233b]">{fmtQty(trace.available, trace.material.unit)}</div>
                  <div className="text-[11px] text-[#8a97b1]">Available</div>
                </div>
                <div className="rounded-lg bg-[#f8fafd] p-2.5">
                  <div className="font-mono-num text-sm font-semibold text-[#16233b]">{fmtQty(trace.required, trace.material.unit)}</div>
                  <div className="text-[11px] text-[#8a97b1]">Required</div>
                </div>
                <div className={`rounded-lg p-2.5 ${trace.short ? 'bg-[#fdeeee]' : 'bg-[#e9f7f1]'}`}>
                  <div className={`font-mono-num text-sm font-semibold ${trace.short ? 'text-[#e05252]' : 'text-[#1f9d74]'}`}>{fmtQty(trace.balance, trace.material.unit)}</div>
                  <div className="text-[11px] text-[#8a97b1]">Net balance</div>
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-xs font-medium text-[#64748f]">
                  Demand across {trace.modelsUsing} model{trace.modelsUsing === 1 ? '' : 's'}
                </div>
                <div className="max-h-[260px] space-y-1 overflow-auto pr-1">
                  {trace.demandByModel.map((t) => (
                    <div key={t.modelKey} className="flex items-center justify-between rounded-lg border border-[#eef1f8] px-3 py-1.5 text-sm">
                      <span className="font-medium text-[#16233b]">{t.modelKey.split('|')[0]}
                        <span className="ml-1.5 text-xs text-[#8a97b1]">{t.modelKey.split('|')[1]}</span>
                      </span>
                      <span className="font-mono-num text-[#3c4a63]">{fmtQty(t.qty, trace.material.unit)} {trace.material.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#8a97b1]">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[130px] border-[#d7dcea] text-sm text-[#3c4a63]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
