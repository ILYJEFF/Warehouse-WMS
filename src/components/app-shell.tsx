import Link from "next/link";
import { ExternalLink, User } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { isAdmin, roleLabel } from "@/lib/auth";
import { ActivityTracker } from "@/components/activity-tracker";
import { HeaderSkuSearch } from "@/components/header-sku-search";
import { MobileNav } from "@/components/mobile-nav";
import { SideNav } from "@/components/side-nav";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const admin = isAdmin(user.role);
  const label = roleLabel(user.role);
  const hubUrl = process.env.HUB_APP_URL?.replace(/\/$/, "");

  return (
    <div className="min-h-screen">
      <ActivityTracker />
      <header className="flex h-[50px] items-center justify-between gap-4 bg-[#3c8dbc] px-4 text-white shadow-sm">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <MobileNav showAdmin={admin} userName={user.name} roleLabel={label} />
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 text-white no-underline hover:no-underline"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8" />
            </span>
            <span className="truncate text-lg font-light">Techchefs WMS</span>
          </Link>
          {hubUrl ? (
            <a
              href={hubUrl}
              className="hidden items-center gap-1 rounded-sm border border-white/25 bg-white/10 px-2 py-1 text-[11px] uppercase tracking-wide text-white no-underline hover:bg-white/20 hover:no-underline sm:inline-flex"
              title="Open Techchefs Hub"
            >
              Hub
              <ExternalLink className="h-3 w-3 opacity-80" />
            </a>
          ) : null}
        </div>
        <div className="hidden min-w-0 flex-1 justify-center px-4 md:flex lg:px-8">
          <HeaderSkuSearch />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-2 text-sm sm:flex">
            <User className="h-4 w-4" />
            {user.name}
            <span className="rounded-sm bg-white/15 px-1.5 py-0.5 text-[11px] uppercase tracking-wide">
              {label}
            </span>
          </span>
          <form action={logoutAction} className="hidden sm:block">
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
          <SideNav showAdmin={admin} />
        </aside>

        <div className="min-w-0 flex-1 bg-[#ecf0f5]">{children}</div>
      </div>
    </div>
  );
}
