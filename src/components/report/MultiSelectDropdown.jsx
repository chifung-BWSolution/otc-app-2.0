import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

export default function MultiSelectDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  const displayText = selected.length === 0
    ? label
    : selected.length <= 2
      ? selected.join(", ")
      : `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-xs transition-colors min-w-[80px] max-w-[180px] ${
          selected.length > 0
            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <span className="truncate flex-1 text-left">{displayText}</span>
        {selected.length > 0 ? (
          <X size={11} className="shrink-0 hover:text-red-500" onClick={(e) => { e.stopPropagation(); onChange([]); }} />
        ) : (
          <ChevronDown size={11} className="shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {options.length > 6 && (
            <div className="p-2 border-b border-gray-100">
              <input
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                placeholder={`搜尋${label}...`}
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
            {filtered.map(opt => (
              <label
                key={opt}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                  selected.includes(opt) ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="accent-indigo-600 w-3.5 h-3.5"
                />
                <span className="truncate">{opt}</span>
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