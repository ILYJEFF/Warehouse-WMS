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
  Warehouse,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Items", icon: Boxes },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/stock", label: "Stock", icon: Warehouse },
  { href: "/receive", label: "Receive", icon: PackagePlus },
  { href: "/pull", label: "Pull to Job", icon: PackageMinus },
  { href: "/moves", label: "Recent Activity", icon: ClipboardList },
] as const;

export function SideNav() {
  const pathname = usePathname();

  return (
    <ul className="m-0 list-none p-0">
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
              className={`flex items-center gap-3 border-l-[3px] px-[15px] py-3 text-sm transition ${
                active
                  ? "border-l-[#3c8dbc] bg-[#1a2226] text-white"
                  : "border-l-transparent text-[#b8c7ce] hover:bg-[#1e282c] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
