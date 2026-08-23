"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Menu,
  PackageMinus,
  PackagePlus,
  Users,
  Warehouse,
  X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
};

const ALL_NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/receive", label: "Receive", icon: PackagePlus },
  { href: "/pull", label: "Pull", icon: PackageMinus },
  { href: "/stock", label: "Stock", icon: Warehouse },
  { href: "/items", label: "Items", icon: Boxes },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/moves", label: "Activity", icon: ClipboardList },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
];

const BOTTOM_HREFS = ["/", "/receive", "/pull", "/stock"] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileChrome({
  showAdmin = false,
  userName,
  roleLabel,
  logout,
}: {
  showAdmin?: boolean;
  userName: string;
  roleLabel: string;
  logout: (formData: FormData) => void | Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const nav = ALL_NAV.filter((item) => !item.adminOnly || showAdmin);
  const bottom = BOTTOM_HREFS.map(
    (href) => nav.find((item) => item.href === href)!,
  );

  return (
    <>
      <header className="mobile-topbar lg:hidden">
        <button
          type="button"
          className="mobile-icon-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/" className="mobile-brand">
          <span className="mobile-brand-mark">TC</span>
          <span>Techchefs WMS</span>
        </Link>
        <div className="mobile-user-chip" title={userName}>
          <span className="truncate max-w-[4.5rem]">{userName.split(" ")[0]}</span>
          <span className="mobile-role">{roleLabel}</span>
        </div>
      </header>

      {open ? (
        <div className="mobile-drawer-root lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="mobile-drawer-backdrop"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav className="mobile-drawer-panel">
            <div className="mobile-drawer-head">
              <div>
                <p className="m-0 text-sm font-semibold text-white">{userName}</p>
                <p className="m-0 mt-0.5 text-xs text-[#b8c7ce]">{roleLabel}</p>
              </div>
              <button
                type="button"
                className="mobile-icon-btn"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="mobile-drawer-list">
              {nav.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`mobile-drawer-link ${active ? "is-active" : ""}`}
                    >
                      <Icon className="h-5 w-5 shrink-0 opacity-90" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mobile-drawer-foot">
              <form action={logout}>
                <button type="submit" className="mobile-signout">
                  Sign out
                </button>
              </form>
            </div>
          </nav>
        </div>
      ) : null}

      <nav className="mobile-bottombar lg:hidden" aria-label="Primary">
        {bottom.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-tab ${active ? "is-active" : ""}`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`mobile-tab ${open ? "is-active" : ""}`}
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
