"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function CollapsibleFormBox({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="box box-primary">
      <button
        type="button"
        className="box-header collapse-form-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <div className="box-body">{children}</div> : null}
    </div>
  );
}
