"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  PackageMinus,
  PackagePlus,
  Settings,
  Trophy,
  Warehouse,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Items", icon: Boxes },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/stock", label: "Stock", icon: Warehouse },
  { href: "/receive", label: "Receive", icon: PackagePlus },
  { href: "/pull", label: "Pull to Job", icon: PackageMinus },
  { href: "/top-skus", label: "Top 100 SKUs", icon: Trophy },
  { href: "/moves", label: "Recent Activity", icon: ClipboardList },
] as const;

const SETTINGS_HREFS = ["/settings", "/users", "/tags"] as const;

function isSettingsPath(pathname: string) {
  return SETTINGS_HREFS.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

export function SideNav({ showAdmin = false }: { showAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <ul className="side-nav m-0 list-none p-0">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`side-nav-link flex items-center gap-3 border-l-[3px] px-[15px] py-3 text-sm transition ${
                active ? "is-active" : ""
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          </li>
        );
      })}

      {showAdmin ? (
        <>
          <li className="side-nav-section" aria-hidden="true">
            Settings
          </li>
          <li>
            <Link
              href="/settings"
              className={`side-nav-link flex items-center gap-3 border-l-[3px] px-[15px] py-3 text-sm transition ${
                isSettingsPath(pathname) ? "is-active" : ""
              }`}
            >
              <Settings className="h-4 w-4 shrink-0 opacity-80" />
              <span className="whitespace-nowrap">Settings</span>
            </Link>
          </li>
        </>
      ) : null}
    </ul>
  );
}
