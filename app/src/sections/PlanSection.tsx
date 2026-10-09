import { useMemo, useState } from 'react';
import type { WorkspaceData, WorkspaceStats } from '@/types/workspace';
import type { WorkspaceApi } from '@/hooks/useWorkspace';
import { fmtInt } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Pencil, CalendarClock } from 'lucide-react';

export function PlanSection({ data, stats, ws }: { data: WorkspaceData; stats: WorkspaceStats; ws: WorkspaceApi }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('withQty');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [recordedDate, setRecordedDate] = useState<number | null>(null);

  const statByKey = useMemo(() => new Map(stats.modelStats.map((s) => [s.key, s])), [stats.modelStats]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.models
      .filter((m) => (filter === 'withQty' ? m.planQty > 0 : true))
      .filter((m) => !needle || m.model.toLowerCase().includes(needle) || m.fgCode.toLowerCase().includes(needle))
      .sort((a, b) => b.planQty - a.planQty);
  }, [data.models, q, filter]);

  const editing = editKey ? data.models.find((m) => `${m.model}|${m.fgCode}` === editKey) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#16233b]">Production plan</h2>
          <p className="text-sm text-[#64748f]">Edit FG quantities to recalculate shared-material requirements.</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="border-[#d7dcea] text-[#3c4a63]">
                <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                {recordedDate ? `Recorded: ${data.monthLabel.split(' ')[0]} ${recordedDate}` : 'Select recorded date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[272px] p-3" align="end">
              <div className="mb-2 text-xs font-medium text-[#64748f]">Recorded production as of day</div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <button key={d} onClick={() => setRecordedDate(d === recordedDate ? null : d)}
                    className={`h-8 rounded-md text-xs font-medium transition ${recordedDate === d ? 'bg-[#4f6bed] text-white' : 'text-[#3c4a63] hover:bg-[#eef2ff]'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a97b1]" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search model or FG code"
              className="h-8 w-[210px] border-[#d7dcea] pl-8 text-sm" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 w-[190px] border-[#d7dcea] text-sm text-[#3c4a63]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="withQty">Models with quantities</SelectItem>
              <SelectItem value="all">All models</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-8 rounded-xl border border-[#dbe4fb] bg-[#eef2ff] px-5 py-4">
        <div>
          <span className="text-[26px] font-bold text-[#3f5ad9]">{fmtInt(stats.plannedTvs)}</span>
          <span className="ml-1.5 text-sm text-[#64748f]">planned TVs</span>
        </div>
        <div>
          <span className="text-[26px] font-bold text-[#3f5ad9]">{fmtInt(stats.recordedTvs)}</span>
          <span className="ml-1.5 text-sm text-[#64748f]">Recorded{recordedDate ? ` · day ${recordedDate}` : ''}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4e8f2] bg-white shadow-[0_1px_2px_rgba(22,35,59,0.05)]">
        <table className="w-full text-sm">
          <thead className="bg-[#f8fafd] text-left text-xs uppercase tracking-wide text-[#8a97b1]">
            <tr>
              <th className="px-5 py-3 font-medium">Model / FG code</th>
              <th className="px-3 py-3 font-medium">Country</th>
              <th className="px-3 py-3 font-medium">Version</th>
              <th className="px-3 py-3 text-right font-medium">{data.monthLabel}</th>
              <th className="px-3 py-3 text-right font-medium">Recorded</th>
              <th className="px-3 py-3 font-medium">BOM</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const key = `${m.model}|${m.fgCode}`;
              const st = statByKey.get(key);
              return (
                <tr key={key} className="border-t border-[#f0f3fa] transition hover:bg-[#f7f9fe]">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-[#16233b]">{m.model}</div>
                    <div className="font-mono-num text-xs text-[#8a97b1]">{m.fgCode}</div>
                  </td>
                  <td className="px-3 py-3 text-[#3c4a63]">{m.country}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-[#f1f4fb] px-1.5 py-0.5 text-xs text-[#64748f]">{m.version}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono-num font-semibold text-[#3f5ad9]">{fmtInt(m.planQty)}</td>
                  <td className="px-3 py-3 text-right font-mono-num text-[#3c4a63]">{fmtInt(m.recordedQty)}</td>
                  <td className="px-3 py-3">
                    {st?.bomMapped
                      ? <Badge className="bg-[#e9f7f1] text-[#1f9d74] hover:bg-[#e9f7f1]">Mapped</Badge>
                      : <Badge className="bg-[#fdf4e7] text-[#d9930d] hover:bg-[#fdf4e7]">Missing</Badge>}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => { setEditKey(key); setEditVal(String(m.planQty)); }}
                      className="rounded-lg border border-[#e4e8f2] p-1.5 text-[#64748f] transition hover:border-[#4f6bed] hover:text-[#4f6bed]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-[#8a97b1]">
                No models in this scope. Import a Plans sheet to add models.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditKey(null)}>
        <DialogContent className="sm:max-w-sm">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{editing.model}</DialogTitle>
              </DialogHeader>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#64748f]">{data.monthLabel} quantity</label>
                <Input
                  type="number" min={0} value={editVal} autoFocus
                  onChange={(e) => setEditVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      ws.updatePlanQty(`${editing.model}|${editing.fgCode}`, Number(editVal) || 0);
                      setEditKey(null);
                    }
                  }}
                  className="font-mono-num"
                />
                <p className="text-xs text-[#8a97b1]">Shared-material requirements recalculate immediately. Save changes to keep them.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditKey(null)}>Cancel</Button>
                <Button className="bg-[#4f6bed] hover:bg-[#405edd]" onClick={() => {
                  ws.updatePlanQty(`${editing.model}|${editing.fgCode}`, Number(editVal) || 0);
                  setEditKey(null);
                }}>Apply</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
