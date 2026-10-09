import { useMemo, useState } from 'react';
import type { WorkspaceData } from '@/types/workspace';
import type { WorkspaceApi } from '@/hooks/useWorkspace';
import { fmtQty } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Pencil } from 'lucide-react';

export function MaterialsSection({ data, ws }: { data: WorkspaceData; ws: WorkspaceApi }) {
  const [q, setQ] = useState('');
  const [scope, setScope] = useState('all');
  const [editCode, setEditCode] = useState<string | null>(null);
  const [openVal, setOpenVal] = useState('');
  const [snVal, setSnVal] = useState('');

  const bomCodes = useMemo(() => new Set(data.bom.map((b) => b.materialCode)), [data.bom]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.materials
      .filter((m) => {
        if (scope === 'bom') return bomCodes.has(m.code);
        if (scope === 'nostock') return m.openingStock === 0 && m.snQty === 0;
        return true;
      })
      .filter((m) => !needle || m.code.toLowerCase().includes(needle) || m.description.toLowerCase().includes(needle))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [data.materials, q, scope, bomCodes]);

  const editing = editCode ? data.materials.find((m) => m.code === editCode) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#16233b]">Stock &amp; supply inputs</h2>
          <p className="text-sm text-[#64748f]">Opening stock and cumulative SN quantities, in each material's base unit.</p>
        </div>
        <div className="ml-auto">
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-8 w-[170px] border-[#d7dcea] text-sm text-[#3c4a63]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All BOM items</SelectItem>
              <SelectItem value="bom">Used in BOM</SelectItem>
              <SelectItem value="nostock">No stock row</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4e8f2] bg-white shadow-[0_1px_2px_rgba(22,35,59,0.05)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#eef1f8] px-5 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a97b1]" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search material code or description"
              className="h-8 w-[280px] border-[#d7dcea] pl-8 text-sm" />
          </div>
          <span className="ml-auto text-xs text-[#8a97b1]">
            Source: {data.sources.stock.name} + {data.sources.sn.name} (Request Qty)
          </span>
        </div>

        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#f8fafd] text-left text-xs uppercase tracking-wide text-[#8a97b1]">
              <tr>
                <th className="px-5 py-2.5 font-medium">Material / description</th>
                <th className="px-3 py-2.5 font-medium">Location</th>
                <th className="px-3 py-2.5 font-medium">Type / unit</th>
                <th className="px-3 py-2.5 text-right font-medium">Opening stock</th>
                <th className="px-3 py-2.5 text-right font-medium">SN quantity</th>
                <th className="px-3 py-2.5 font-medium">Source stock</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 300).map((m) => (
                <tr key={m.code} className="border-t border-[#f0f3fa] transition hover:bg-[#f7f9fe]">
                  <td className="px-5 py-2.5">
                    <div className="font-mono-num text-[13px] font-semibold text-[#3f5ad9]">{m.code}</div>
                    <div className="max-w-[320px] truncate text-xs text-[#8a97b1]">{m.description || '—'}</div>
                  </td>
                  <td className="px-3 py-2.5 text-[#3c4a63]">{m.location || '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-[#3c4a63]">{m.type}</div>
                    <div className="text-xs text-[#8a97b1]">{m.unit}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono-num text-[#3c4a63]">{fmtQty(m.openingStock, m.unit)}</td>
                  <td className="px-3 py-2.5 text-right font-mono-num text-[#3c4a63]">{fmtQty(m.snQty, m.unit)}</td>
                  <td className="px-3 py-2.5">
                    {m.openingStock === 0 && m.snQty === 0
                      ? <Badge className="bg-[#fdf4e7] text-[#b57e0a] hover:bg-[#fdf4e7]">No stock row · 0</Badge>
                      : <Badge className="bg-[#f1f4fb] text-[#64748f] hover:bg-[#f1f4fb]">Available</Badge>}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => { setEditCode(m.code); setOpenVal(String(m.openingStock)); setSnVal(String(m.snQty)); }}
                      className="rounded-lg border border-[#e4e8f2] p-1.5 text-[#64748f] transition hover:border-[#4f6bed] hover:text-[#4f6bed]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-[#8a97b1]">
                  No materials found. Import an Opening Stock sheet to add materials.
                </td></tr>
              )}
            </tbody>
          </table>
          {rows.length > 300 && (
            <div className="border-t border-[#f0f3fa] px-5 py-2 text-xs text-[#8a97b1]">
              Showing first 300 of {rows.length.toLocaleString()} rows — narrow the search to edit a specific material.
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditCode(null)}>
        <DialogContent className="sm:max-w-sm">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono-num">{editing.code}</DialogTitle>
                <DialogDescription>{editing.description || 'No description'} · {editing.unit}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#64748f]">Opening stock</label>
                  <Input type="number" min={0} step="any" value={openVal} onChange={(e) => setOpenVal(e.target.value)} className="font-mono-num" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#64748f]">SN quantity</label>
                  <Input type="number" min={0} step="any" value={snVal} onChange={(e) => setSnVal(e.target.value)} className="font-mono-num" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditCode(null)}>Cancel</Button>
                <Button className="bg-[#4f6bed] hover:bg-[#405edd]" onClick={() => {
                  ws.updateMaterial(editing.code, {
                    openingStock: Math.max(0, Number(openVal) || 0),
                    snQty: Math.max(0, Number(snVal) || 0),
                  });
                  setEditCode(null);
                }}>Apply</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
