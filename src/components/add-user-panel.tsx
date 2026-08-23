"use client";

import { Users } from "lucide-react";
import { createUser } from "@/lib/actions/users";
import { CollapsibleFormBox } from "@/components/collapsible-form-box";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-constants";

export function AddUserPanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <CollapsibleFormBox
      title="Add User"
      icon={<Users className="h-4 w-4" />}
      defaultOpen={defaultOpen}
    >
      <form action={createUser} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="field-label">Name</span>
          <input className="field" name="name" required autoComplete="off" />
        </label>
        <label className="block">
          <span className="field-label">Email</span>
          <input
            className="field"
            type="email"
            name="email"
            required
            autoComplete="off"
            inputMode="email"
          />
        </label>
        <label className="block">
          <span className="field-label">Role</span>
          <select className="field" name="role" defaultValue="USER">
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">
            Temporary password (min {MIN_PASSWORD_LENGTH} chars)
          </span>
          <input
            className="field"
            type="password"
            name="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
        </label>
        <label className="flex items-start gap-2 text-sm sm:col-span-2 lg:col-span-3">
          <input
            type="checkbox"
            name="twoFactorRequired"
            value="true"
            className="mt-1"
          />
          <span>
            Require authenticator app (they set it up on first sign-in)
          </span>
        </label>
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <button type="submit" className="btn-primary">
            Create user
          </button>
        </div>
      </form>
    </CollapsibleFormBox>
  );
}
