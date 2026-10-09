export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[#1b2942] text-white shadow-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4f6bed]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 2 9 4.9v9.9L12 22l-9-5.1V6.9L12 2Z" />
            <path d="m3.3 7 8.7 4.7 8.7-4.7" />
            <path d="M12 22V12" />
          </svg>
        </div>
        <span className="text-[17px] font-bold tracking-tight">SupplyPlan</span>
        <span className="mx-1 h-5 w-px bg-white/25" />
        <span className="text-sm text-white/70">Materials workspace</span>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-white/70">Private workspace</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 bg-[#31405f] text-xs font-semibold">
            AD
          </span>
        </div>
      </div>
    </header>
  );
}
