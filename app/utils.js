export const uid = (prefix="id") => `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;

export function clampText(s, max=140){
  if(!s) return "";
  s = String(s);
  return s.length > max ? s.slice(0, max-1) + "…" : s;
}

export function fmtDate(d){
  if(!d) return "";
  try {
    const dt = new Date(d);
    if(Number.isNaN(dt.getTime())) return d;
    return dt.toISOString().slice(0,10);
  } catch { return d; }
}

export function downloadJson(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file){
  const text = await file.text();
  return JSON.parse(text);
}
