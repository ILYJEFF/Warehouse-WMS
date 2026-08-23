import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Store, Tags, Users } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { DemoDataPanel } from "@/components/demo-data-panel";
import { isAdmin, requireUser } from "@/lib/auth";
import { demoStatsTotal, getDemoStats } from "@/lib/demo-seed";
import { prisma } from "@/lib/prisma";

const SETTINGS_LINKS = [
  {
    href: "/users",
    title: "Users",
    description: "Create accounts, set roles, require authenticator 2FA, and review last login.",
    icon: Users,
    accent: "#3c8dbc",
  },
  {
    href: "/vendors",
    title: "Vendors",
    description: "Suppliers you buy SKUs from. Assign them optionally on each item.",
    icon: Store,
    accent: "#f39c12",
  },
  {
    href: "/tags",
    title: "Tags",
    description: "Manage the shared tag catalog used on items: names, colors, and cleanup.",
    icon: Tags,
    accent: "#00a65a",
  },
] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; items?: string; moves?: string }>;
}) {
  const me = await requireUser();
  if (!me || !isAdmin(me.role)) redirect("/");

  const params = await searchParams;
  const stats = await getDemoStats(prisma);
  const total = demoStatsTotal(stats);

  const banner =
    params.demo === "loaded"
      ? `Test data loaded (${params.items ?? stats.items} SKUs, ${params.moves ?? stats.moves} moves).`
      : params.demo === "cleared"
        ? "Test data deleted. Real records were left alone."
        : params.demo === "empty"
          ? "No test data to delete."
          : null;

  return (
    <>
      <div className="content-header">
        <div className="content-header-row">
          <BackButton href="/" label="Back to dashboard" />
        </div>
        <h1>Settings</h1>
      </div>
      <section className="content">
        <p className="mb-5 max-w-2xl text-sm text-[#777]">
          Admin tools for people, vendors, and catalog labels. Pick a section to manage.
        </p>

        {banner ? (
          <div className="mb-4 rounded bg-[#dff0d8] px-3 py-2 text-sm text-[#3c763d]">
            {banner}
          </div>
        ) : null}

        <DemoDataPanel stats={stats} total={total} />

        <div className="settings-grid mt-4">
          {SETTINGS_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="settings-tile group"
                style={{ ["--tile-accent" as string]: item.accent }}
              >
                <span className="settings-tile-icon" aria-hidden>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="settings-tile-body">
                  <span className="settings-tile-title">{item.title}</span>
                  <span className="settings-tile-desc">{item.description}</span>
                </span>
                <ArrowRight className="settings-tile-arrow h-5 w-5" />
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
