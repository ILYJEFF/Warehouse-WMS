"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SideNav } from "@/components/side-nav";
import { logoutAction } from "@/lib/actions/auth";

export function MobileNav({
  showAdmin = false,
  userName,
  roleLabel,
}: {
  showAdmin?: boolean;
  userName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mobile-nav-toggle lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="mobile-nav-root lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="mobile-nav-backdrop"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="mobile-nav-drawer">
            <div className="mobile-nav-drawer-head">
              <div>
                <p className="m-0 text-sm font-semibold text-white">{userName}</p>
                <p className="m-0 mt-0.5 text-xs text-[#b8c7ce]">{roleLabel}</p>
              </div>
              <button
                type="button"
                className="mobile-nav-toggle"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-[#1a2226] px-4 py-3">
              <p className="m-0 truncate text-xs text-[#4b646f]">MAIN NAVIGATION</p>
            </div>
            <div className="mobile-nav-drawer-body">
              <SideNav showAdmin={showAdmin} />
            </div>
            <div className="mobile-nav-drawer-foot">
              <form action={logoutAction}>
                <button type="submit" className="mobile-nav-signout">
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
