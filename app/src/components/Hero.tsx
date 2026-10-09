import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { RotateCcw, Download, Upload, Save, Loader2 } from 'lucide-react';
import type { WorkspaceApi } from '@/hooks/useWorkspace';

export function Hero({ ws, fileRef }: { ws: WorkspaceApi; fileRef: React.RefObject<HTMLInputElement | null> }) {
  const [resetOpen, setResetOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ sheet: string; rows: number; applied: string }[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setImporting(true);
    setImportError(null);
    try {
      const summaries = await ws.importWorkbook(f);
      if (summaries.length === 0) setImportError('No matching sheets found. Expected sheets like Plans, BOM, Opening Stock, SN.');
      else setImportResult(summaries);
    } catch {
      setImportError('Could not read this workbook. Please upload a valid .xlsx file.');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a97b1]">
          Supply chain / Material planning
        </div>
        <h1 className="text-[26px] font-bold leading-tight text-[#16233b]">
          Plan ahead. See the shortage.
        </h1>
        <p className="mt-1 text-sm text-[#64748f]">
          Production requirements, shared materials and stock coverage in one place.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="border-[#d7dcea] bg-white text-[#3c4a63] hover:bg-[#f4f6fb]" onClick={() => setResetOpen(true)}>
          <RotateCcw className="mr-1.5 h-4 w-4" /> Reset all data
        </Button>
        <Button variant="outline" className="border-[#d7dcea] bg-white text-[#3c4a63] hover:bg-[#f4f6fb]" onClick={ws.exportWorkbook}>
          <Download className="mr-1.5 h-4 w-4" /> Export
        </Button>
        <Button variant="outline" className="border-[#d7dcea] bg-white text-[#3c4a63] hover:bg-[#f4f6fb]" onClick={() => fileRef.current?.click()} disabled={importing}>
          {importing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
          Import workbook
        </Button>
        <Button
          onClick={ws.save}
          disabled={!ws.dirty}
          className={ws.dirty
            ? 'bg-[#4f6bed] text-white hover:bg-[#405edd] shadow-[0_2px_8px_rgba(79,107,237,0.35)]'
            : 'bg-[#a9b6d3] text-white cursor-not-allowed'}
        >
          <Save className="mr-1.5 h-4 w-4" /> Save changes
        </Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This discards every change and restores the original demo workspace (BOM, opening stock, SN and monthly plan).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[#e05252] hover:bg-[#c73e3e]" onClick={ws.resetAll}>Reset workspace</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!importResult || !!importError} onOpenChange={() => { setImportResult(null); setImportError(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{importError ? 'Import failed' : 'Import review'}</DialogTitle>
            <DialogDescription>
              {importError ?? 'These inputs were replaced. Review the numbers, then select Save changes to keep them.'}
            </DialogDescription>
          </DialogHeader>
          {importResult && (
            <div className="space-y-2">
              {importResult.map((s) => (
                <div key={s.sheet} className="flex items-center justify-between rounded-lg border border-[#e4e8f2] bg-[#f8fafd] px-3 py-2 text-sm">
                  <span className="font-medium text-[#16233b]">{s.applied}</span>
                  <span className="text-[#64748f]">{s.rows.toLocaleString()} rows · sheet “{s.sheet}”</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setImportResult(null); setImportError(null); }} className="bg-[#4f6bed] text-white hover:bg-[#405edd]">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
