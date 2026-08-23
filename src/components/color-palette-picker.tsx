"use client";

import { useEffect, useRef, useState } from "react";
import { TAG_COLOR_PRESETS, tagTextColor } from "@/lib/tags";

/** Dense digital palette squares (presets + extras). */
export const COLOR_PALETTE_SQUARES = [
  ...TAG_COLOR_PRESETS,
  "#111111",
  "#555555",
  "#aaaaaa",
  "#ffffff",
  "#7f8c8d",
  "#16a085",
  "#27ae60",
  "#2980b9",
  "#8e44ad",
  "#2c3e50",
  "#f1c40f",
  "#e67e22",
  "#e74c3c",
  "#c0392b",
  "#1abc9c",
  "#3498db",
] as const;

type Hsv = { h: number; s: number; v: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return { r: 60, g: 141, b: 188 };
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const to = (n: number) =>
    Math.round(clamp(n, 0, 255))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsv(r: number, g: number, b: number): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  };
}

function hexToHsv(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsv(r, g, b);
}

function hsvToHex(h: number, s: number, v: number) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

function normalizeHex(raw: string) {
  let value = raw.trim();
  if (!value.startsWith("#")) value = `#${value}`;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const a = value[1];
    const b = value[2];
    const c = value[3];
    value = `#${a}${a}${b}${b}${c}${c}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) return null;
  return value.toLowerCase();
}

type ColorPalettePickerProps = {
  value: string;
  onChange: (hex: string) => void;
  /** Compact layout for inline item tag create. */
  compact?: boolean;
};

export function ColorPalettePicker({
  value,
  onChange,
  compact = false,
}: ColorPalettePickerProps) {
  const [hsv, setHsv] = useState(() => hexToHsv(value || TAG_COLOR_PRESETS[0]));
  const [hexDraft, setHexDraft] = useState(
    () => (normalizeHex(value) || TAG_COLOR_PRESETS[0]).toLowerCase(),
  );
  const hsvRef = useRef(hsv);
  const onChangeRef = useRef(onChange);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"sv" | "hue" | null>(null);

  hsvRef.current = hsv;
  onChangeRef.current = onChange;

  const hex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const hueColor = hsvToHex(hsv.h, 1, 1);

  useEffect(() => {
    const next = normalizeHex(value);
    if (!next) return;
    const current = hsvToHex(
      hsvRef.current.h,
      hsvRef.current.s,
      hsvRef.current.v,
    );
    if (next === current) return;
    setHsv(hexToHsv(next));
    setHexDraft(next);
  }, [value]);

  function commit(next: Hsv) {
    hsvRef.current = next;
    setHsv(next);
    const out = hsvToHex(next.h, next.s, next.v);
    setHexDraft(out);
    onChangeRef.current(out);
  }

  function pickPreset(preset: string) {
    commit(hexToHsv(preset.toLowerCase()));
  }

  function applyHexDraft() {
    const next = normalizeHex(hexDraft);
    if (!next) {
      setHexDraft(hex);
      return;
    }
    commit(hexToHsv(next));
  }

  function readSv(clientX: number, clientY: number) {
    const el = svRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = clamp((clientX - rect.left) / rect.width, 0, 1);
    const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
    commit({ ...hsvRef.current, s, v });
  }

  function readHue(clientX: number) {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const h = clamp(((clientX - rect.left) / rect.width) * 360, 0, 359.999);
    commit({ ...hsvRef.current, h });
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (dragging.current === "sv") readSv(e.clientX, e.clientY);
      if (dragging.current === "hue") readHue(e.clientX);
    }
    function onUp() {
      dragging.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div className={`color-palette ${compact ? "is-compact" : ""}`}>
      <div className="color-palette-preview-row">
        <span
          className="color-palette-preview"
          style={{ background: hex, color: tagTextColor(hex) }}
          title={hex}
        >
          Aa
        </span>
        <label className="color-palette-hex">
          <span className="sr-only">Hex color</span>
          <input
            className="field color-palette-hex-input"
            value={hexDraft}
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={applyHexDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyHexDraft();
              }
            }}
            spellCheck={false}
            autoComplete="off"
          />
        </label>
      </div>

      <div
        className="color-palette-squares"
        role="listbox"
        aria-label="Color palette"
      >
        {COLOR_PALETTE_SQUARES.map((color) => {
          const active = color.toLowerCase() === hex;
          return (
            <button
              key={color}
              type="button"
              role="option"
              aria-selected={active}
              className={`color-palette-square ${active ? "is-active" : ""} ${
                color.toLowerCase() === "#ffffff" ? "is-light" : ""
              }`}
              style={{ background: color }}
              aria-label={`Color ${color}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pickPreset(color)}
            />
          );
        })}
      </div>

      <div className="color-palette-gradient-block">
        <div
          ref={svRef}
          className="color-palette-sv"
          style={{
            background: `
              linear-gradient(to top, #000, transparent),
              linear-gradient(to right, #fff, ${hueColor})
            `,
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            dragging.current = "sv";
            readSv(e.clientX, e.clientY);
          }}
        >
          <span
            className="color-palette-sv-knob"
            style={{
              left: `${hsv.s * 100}%`,
              top: `${(1 - hsv.v) * 100}%`,
              background: hex,
            }}
          />
        </div>

        <div
          ref={hueRef}
          className="color-palette-hue"
          onPointerDown={(e) => {
            e.preventDefault();
            dragging.current = "hue";
            readHue(e.clientX);
          }}
        >
          <span
            className="color-palette-hue-knob"
            style={{ left: `${(hsv.h / 360) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
