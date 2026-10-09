import type { WorkspaceData, WorkspaceStats } from '@/types/workspace';
import type { WorkspaceApi } from '@/hooks/useWorkspace';
import { fmtInt } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { FileDown, Info } from 'lucide-react';

function Rule({ title, formula, note }: { title: string; formula: string; note?: string }) {
  return (
    <div className="border-b border-[#eef1f8] py-3.5 last:border-0">
      <div className="text-xs font-medium text-[#8a97b1]">{title}</div>
      <div className="mt-0.5 text-[15px] font-semibold text-[#3f5ad9]">{formula}</div>
      {note && <div className="mt-1 text-xs leading-relaxed text-[#64748f]">{note}</div>}
    </div>
  );
}

export function CalcSection({ data, stats, ws }: { data: WorkspaceData; stats: WorkspaceStats; ws: WorkspaceApi }) {
  const s = data.sources;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#16233b]">Calculation &amp; source review</h2>
          <p className="text-sm text-[#64748f]">How the workbook becomes a shared-material shortage calculation.</p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto border-[#d7dcea] text-[#3c4a63]" onClick={ws.exportWorkbook}>
          <FileDown className="mr-1.5 h-3.5 w-3.5" /> Export current data
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-[#e4e8f2] bg-white p-5 shadow-[0_1px_2px_rgba(22,35,59,0.05)]">
          <h3 className="mb-2 text-[15px] font-semibold text-[#16233b]">Calculation rules</h3>
          <Rule
            title="Material demand"
            formula="Σ (model quantity × BOM Required Qty)"
            note="BOM Required Qty per FG code + version. Repeated material lines are added together."
          />
          <Rule title="Full month balance" formula="Opening stock + SN − month demand" />
          <Rule title="Balance after recorded production" formula="Opening stock + SN − recorded demand" />
          <Rule title="Shortage" formula="Maximum of 0 and the negative balance" />
          <p className="mt-3 text-xs leading-relaxed text-[#64748f]">
            Coverage is the percentage of required material codes without a shortage. It is not a percentage of
            complete TVs. Quantities across different units are never added together.
          </p>
        </div>

        <div className="rounded-xl border border-[#e4e8f2] bg-white p-5 shadow-[0_1px_2px_rgba(22,35,59,0.05)]">
          <h3 className="mb-2 text-[15px] font-semibold text-[#16233b]">Workbook sources</h3>
          <div className="space-y-3 text-sm">
            <SrcRow label="Models and plan" value={<>Plans: FG code, version, {data.monthLabel} and recorded production</>} />
            <SrcRow label="BOM" value={<><b className="font-semibold text-[#16233b]">{fmtInt(stats.bomRelationships)}</b> aggregated model–material relationships · <b className="font-semibold text-[#16233b]">{fmtInt(stats.uniqueMaterials)}</b> unique materials</>} />
            <SrcRow label="Opening stock" value={<><i className="not-italic text-[#3c4a63]">{s.stock.name}</i>, opening balance column</>} />
            <SrcRow label="Supply" value={<><i className="not-italic text-[#3c4a63]">{s.sn.name}</i>, Request Qty summed by material code</>} />
            <SrcRow label="Default scope" value={<><b className="font-semibold text-[#16233b]">{fmtInt(stats.shortSkus)}</b> materials with an open shortage in the current scope</>} />
            <SrcRow label="Model matching" value="FG code + version, including destination variants" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#e4e8f2] bg-white p-5 shadow-[0_1px_2px_rgba(22,35,59,0.05)]">
        <h3 className="mb-3 text-[15px] font-semibold text-[#16233b]">Items to review</h3>
        <ul className="space-y-2.5 text-sm text-[#3c4a63]">
          <ReviewItem>BOM import: {s.bom.name}. {fmtInt(s.bom.rows)} rows read; replaces this input only.</ReviewItem>
          <ReviewItem>Opening Stock import: {s.stock.name}. {fmtInt(s.stock.rows)} rows read; replaces this input only.</ReviewItem>
          <ReviewItem>SN / New Deliveries import: {s.sn.name}. {fmtInt(s.sn.rows)} rows read; replaces this input only.</ReviewItem>
          <ReviewItem>Monthly Plan import: {s.plan.name}. {fmtInt(s.plan.rows)} rows read; replaces this input only. Previous-period consumption is preserved.</ReviewItem>
          <ReviewItem>
            <b className="font-semibold text-[#16233b]">{fmtInt(stats.noStockRowCount)}</b> BOM material codes have no
            opening-stock row. They are treated as 0 available and drive shortages when required.
          </ReviewItem>
        </ul>
      </div>

      <div className="rounded-xl border border-[#dbe4fb] bg-[#eef2ff] p-5">
        <h3 className="mb-1.5 flex items-center gap-2 text-[15px] font-semibold text-[#16233b]">
          <Info className="h-4 w-4 text-[#4f6bed]" /> Updating this workspace
        </h3>
        <p className="text-sm leading-relaxed text-[#3c4a63]">
          Change quantities using the edit buttons, then select Save changes. To refresh from Excel, import an XLSX
          workbook with the same sheet names and columns, review the import and save. Imported values replace the
          current workspace; export current data first if you need to retain your edits.
        </p>
      </div>
    </div>
  );
}

function SrcRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-[#eef1f8] pb-2.5 last:border-0">
      <div className="text-xs font-medium text-[#8a97b1]">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function ReviewItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#4f6bed]" />
      <span>{children}</span>
    </li>
  );
}
