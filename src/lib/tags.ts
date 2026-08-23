export const TAG_COLOR_PRESETS = [
  "#3c8dbc",
  "#00a65a",
  "#f39c12",
  "#dd4b39",
  "#605ca8",
  "#00c0ef",
  "#d81b60",
  "#39cccc",
  "#001f3f",
  "#ff851b",
] as const;

export type TagOption = {
  id: string;
  name: string;
  color: string;
};

export function normalizeTagName(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, "-");
}

/** Pick readable text color for a tag background. */
export function tagTextColor(bg: string) {
  const hex = bg.replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#222222" : "#ffffff";
}

export function parseTagIds(formData: FormData) {
  return formData
    .getAll("tagIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

/** newTags entries are "name|color" */
export function parseNewTags(formData: FormData) {
  const out: { name: string; color: string }[] = [];
  const seen = new Set<string>();
  for (const value of formData.getAll("newTags")) {
    const raw = String(value);
    const pipe = raw.lastIndexOf("|");
    if (pipe <= 0) continue;
    const name = normalizeTagName(raw.slice(0, pipe));
    const color = raw.slice(pipe + 1).trim() || TAG_COLOR_PRESETS[0];
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push({ name, color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : TAG_COLOR_PRESETS[0] });
  }
  return out;
}
