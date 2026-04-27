import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

export default function LeaderSelect({ label, value, staffId, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.display_name || "").toLowerCase().includes(q) ||
      (s.team_name || "").toLowerCase().includes(q) ||
      (s.position || "").toLowerCase().includes(q);
  });

  const handleSelect = (staff) => {
    onChange(staff.display_name, staff.bubble_id);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("", "");
  };

  return (
    <div className="relative" ref={ref}>
      <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
      >
        <span className={`flex-1 truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
          {value || "請選擇直屬上司"}
        </span>
        {value ? (
          <X size={14} className="text-gray-400 hover:text-red-500 shrink-0" onClick={handleClear} />
        ) : (
          <ChevronDown size={14} className="text-gray-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 z-[60] overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2 text-gray-400" />
              <input
                className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300"
                placeholder="搜尋姓名、Team..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="text-center py-4 text-xs text-gray-400">無符合結果</div>
            )}
            {filtered.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 ${
                  s.bubble_id === staffId ? "bg-blue-50" : ""
                }`}
              >
                {s.profile_pic ? (
                  <img src={s.profile_pic} className="w-7 h-7 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {(s.display_name || "?")[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{s.display_name}</div>
                  <div className="text-[10px] text-gray-400 truncate">{s.team_name} · {s.team_role_name || s.position || "—"}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}