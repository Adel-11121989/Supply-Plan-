import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CalendarDays } from 'lucide-react';
import { fmtSaved } from '@/lib/format';

export function MonthBar({
  monthLabel, savedAt, onNewWorkspace,
}: { monthLabel: string; savedAt: string | null; onNewWorkspace: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#e4e8f2] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(22,35,59,0.05)]">
      <span className="flex items-center gap-2 text-[15px] font-semibold text-[#16233b]">
        <CalendarDays className="h-4 w-4 text-[#4f6bed]" />
        {monthLabel}
      </span>
      <span className="h-4 w-px bg-[#e4e8f2]" />
      <button onClick={() => setOpen(true)} className="text-sm text-[#7c8aa5] transition hover:text-[#4f6bed]">
        New workspace
      </button>
      <span className="ml-auto text-xs text-[#8a97b1]">
        {savedAt ? `Saved ${fmtSaved(savedAt)}` : 'Demo data · not saved yet'}
      </span>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              All current data is cleared. Import a workbook with Plans, BOM, Opening Stock and SN sheets to rebuild it. Export first if you need to keep your edits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[#4f6bed] hover:bg-[#405edd]" onClick={onNewWorkspace}>New workspace</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
