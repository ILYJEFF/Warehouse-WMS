import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Tags, Users } from "lucide-react";
import { isAdmin, requireUser } from "@/lib/auth";

const SETTINGS_LINKS = [
  {
    href: "/users",
    title: "Users",
    description: "Create accounts, set roles, require authenticator 2FA, and review last login.",
    icon: Users,
    accent: "#3c8dbc",
  },
  {
    href: "/tags",
    title: "Tags",
    description: "Manage the shared tag catalog used on items: names, colors, and cleanup.",
    icon: Tags,
    accent: "#00a65a",
  },
] as const;

export default async function SettingsPage() {
  const me = await requireUser();
  if (!me || !isAdmin(me.role)) redirect("/");

  return (
    <>
      <div className="content-header">
        <h1>Settings</h1>
      </div>
      <section className="content">
        <p className="mb-5 max-w-2xl text-sm text-[#777]">
          Admin tools for people and catalog labels. Pick a section to manage.
        </p>

        <div className="settings-grid">
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
