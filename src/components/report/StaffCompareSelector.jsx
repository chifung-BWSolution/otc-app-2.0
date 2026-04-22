import { useState, useMemo } from "react";
import { Users, X, ChevronDown, Search } from "lucide-react";

export default function StaffCompareSelector({ allStaff, currentStaffId, selectedIds, onSelectionChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("staff"); // staff | team | position

  const teams = useMemo(() => [...new Set(allStaff.map(s => s.team_name).filter(Boolean))].sort(), [allStaff]);
  const positions = useMemo(() => [...new Set(allStaff.map(s => s.position).filter(Boolean))].sort(), [allStaff]);

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase();
    return allStaff.filter(s => {
      if (s.id === currentStaffId) return false;
      if (!q) return true;
      return (s.display_name || "").toLowerCase().includes(q) ||
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.team_name || "").toLowerCase().includes(q) ||
        (s.position || "").toLowerCase().includes(q);
    });
  }, [allStaff, currentStaffId, search]);

  const toggleStaff = (id) => {
    const next = selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
    onSelectionChange(next);
  };

  const selectByTeam = (team) => {
    const ids = allStaff.filter(s => s.team_name === team && s.id !== currentStaffId).map(s => s.id);
    onSelectionChange(ids);
    setOpen(false);
  };

  const selectByPosition = (pos) => {
    const ids = allStaff.filter(s => s.position === pos && s.id !== currentStaffId).map(s => s.id);
    onSelectionChange(ids);
    setOpen(false);
  };

  const selectedStaff = allStaff.filter(s => selectedIds.includes(s.id));

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 font-semibold">
        <Users size={12} />
        比較員工 {selectedIds.length > 0 && `(${selectedIds.length})`}
        <ChevronDown size={11} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Mode tabs */}
          <div className="flex border-b border-gray-100">
            {[
              { key: "staff", label: "選擇員工" },
              { key: "team", label: "按 Team" },
              { key: "position", label: "按職位" },
            ].map(m => (
              <button key={m.key} onClick={() => setMode(m.key)}
                className={`flex-1 text-xs py-2 font-semibold transition-colors ${mode === m.key ? "text-indigo-700 bg-indigo-50 border-b-2 border-indigo-500" : "text-gray-500 hover:bg-gray-50"}`}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Selected chips */}
          {selectedIds.length > 0 && (
            <div className="p-2 border-b border-gray-100 flex flex-wrap gap-1">
              {selectedStaff.map(s => (
                <span key={s.id} className="flex items-center gap-1 text-[11px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {s.display_name}
                  <button onClick={() => toggleStaff(s.id)}><X size={10} /></button>
                </span>
              ))}
              <button onClick={() => onSelectionChange([])} className="text-[11px] text-red-500 hover:text-red-700 px-1">全部清除</button>
            </div>
          )}

          {mode === "staff" && (
            <>
              <div className="p-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-2 text-gray-400" />
                  <input className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    placeholder="搜尋姓名、Team、職位..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto px-2 pb-2 space-y-0.5">
                {filteredStaff.slice(0, 50).map(s => {
                  const checked = selectedIds.includes(s.id);
                  return (
                    <label key={s.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${checked ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleStaff(s.id)} className="accent-indigo-600 w-3.5 h-3.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-800">{s.display_name}</span>
                        <span className="text-gray-400 ml-1">{s.team_name || ""}</span>
                      </div>
                      <span className="text-gray-400 text-[10px] shrink-0">{s.position || ""}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {mode === "team" && (
            <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
              {teams.map(t => {
                const count = allStaff.filter(s => s.team_name === t && s.id !== currentStaffId).length;
                return (
                  <button key={t} onClick={() => selectByTeam(t)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-indigo-50 transition-colors text-left">
                    <span className="flex-1 font-medium text-gray-800">{t}</span>
                    <span className="text-gray-400">{count} 人</span>
                  </button>
                );
              })}
            </div>
          )}

          {mode === "position" && (
            <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
              {positions.map(p => {
                const count = allStaff.filter(s => s.position === p && s.id !== currentStaffId).length;
                return (
                  <button key={p} onClick={() => selectByPosition(p)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-indigo-50 transition-colors text-left">
                    <span className="flex-1 font-medium text-gray-800">{p}</span>
                    <span className="text-gray-400">{count} 人</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="p-2 border-t border-gray-100">
            <button onClick={() => setOpen(false)} className="w-full bg-indigo-600 text-white text-xs py-1.5 rounded-lg font-bold hover:bg-indigo-700">
              確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}