import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

/**
 * Multi-select dropdown for teams.
 * Props:
 *   teams: string[] OR {id, label}[]
 *   selected: string[] (matching team names or ids)
 *   onChange: (selected: string[]) => void
 */
export default function MultiTeamSelect({ teams, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Normalize: support both string[] and {id, label}[]
  const items = teams.map(t => typeof t === "string" ? { id: t, label: t } : t);

  const filtered = search
    ? items.filter(t => t.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter(v => v !== id) : [...selected, id]);
  };

  const getLabel = (id) => items.find(t => t.id === id)?.label || id;

  const displayText = selected.length === 0
    ? "全部 Team"
    : selected.length <= 2
      ? selected.map(getLabel).join(", ")
      : `${selected.slice(0, 2).map(getLabel).join(", ")} +${selected.length - 2}`;

  return (
    <div className="relative flex-1 min-w-[120px]" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-1.5 border rounded-lg px-3 py-2 text-sm transition-colors text-left ${
          selected.length > 0
            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <span className="truncate flex-1">{displayText}</span>
        {selected.length > 0 ? (
          <X size={12} className="shrink-0 hover:text-red-500" onClick={(e) => { e.stopPropagation(); onChange([]); }} />
        ) : (
          <ChevronDown size={12} className="shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {items.length > 6 && (
            <div className="p-2 border-b border-gray-100">
              <input
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                placeholder="搜尋 Team..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto p-1.5">
            {filtered.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-3">無結果</div>
            )}
            {filtered.map(t => (
              <label
                key={t.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                  selected.includes(t.id) ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(t.id)}
                  onChange={() => toggle(t.id)}
                  className="accent-indigo-600 w-3.5 h-3.5"
                />
                <span className="truncate">{t.label}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-gray-100 p-1.5 flex justify-between">
              <button onClick={() => onChange([])} className="text-[11px] text-red-500 hover:text-red-700 px-2">清除</button>
              <button onClick={() => setOpen(false)} className="text-[11px] text-indigo-600 font-semibold px-2">確定</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}