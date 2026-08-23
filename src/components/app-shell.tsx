import Link from "next/link";
import { Search, User } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { SideNav } from "@/components/side-nav";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="flex h-[50px] items-center justify-between bg-[#3c8dbc] px-4 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-white no-underline hover:no-underline">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-white/20 text-sm font-bold">
              TC
            </span>
            <span className="text-lg font-light">Techchefs WMS</span>
          </Link>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex overflow-hidden rounded-sm bg-white">
            <input
              className="w-48 border-0 px-3 py-1.5 text-sm text-[#555] outline-none"
              placeholder="Lookup by SKU"
              readOnly
            />
            <button
              type="button"
              className="border-0 bg-[#f4f4f4] px-3 text-[#666]"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 text-sm sm:flex">
            <User className="h-4 w-4" />
            {user.name}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-sm border border-white/30 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-50px)]">
        <aside className="hidden w-[230px] shrink-0 bg-[#222d32] lg:block">
          <div className="border-b border-[#1a2226] px-4 py-3">
            <p className="truncate text-xs text-[#4b646f]">MAIN NAVIGATION</p>
          </div>
          <SideNav />
        </aside>

        <div className="min-w-0 flex-1 bg-[#ecf0f5]">
          <div className="border-b border-[#d2d6de] bg-white px-4 py-2 lg:hidden">
            <SideNav />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
