import { useState, useRef, useEffect } from "react";
import { CalendarDays } from "lucide-react";

// Fiscal year: April 1 - March 31
function getCurrentFYStart() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-04-01`;
}
function getCurrentFYEnd() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-03-31`;
}
function getLastFYStart() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() - 1 : now.getFullYear() - 2;
  return `${year}-04-01`;
}
function getLastFYEnd() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-03-31`;
}

function getFYLabel(startStr) {
  const y = parseInt(startStr.slice(0, 4));
  return `FY${y}/${y + 1}`;
}

const PRESETS = [
  { label: "最近 30 天", days: 30 },
  { label: "最近 60 天", days: 60 },
  { label: "最近 90 天", days: 90 },
  { label: "最近 半年", days: 180 },
  { label: "最近 1 年", days: 365 },
  { label: `今個財政年度 (${getFYLabel(getCurrentFYStart())})`, fy: "current" },
  { label: `上個財政年度 (${getFYLabel(getLastFYStart())})`, fy: "last" },
];

export default function DateRangeFilter({ dateRange, customFrom, customTo, onPresetChange, onCustomChange }) {
  const [open, setOpen] = useState(false);
  const [localFrom, setLocalFrom] = useState(customFrom || "");
  const [localTo, setLocalTo] = useState(customTo || "");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePreset = (preset) => {
    if (preset.fy === "current") {
      onCustomChange(getCurrentFYStart(), getCurrentFYEnd());
    } else if (preset.fy === "last") {
      onCustomChange(getLastFYStart(), getLastFYEnd());
    } else {
      onPresetChange(String(preset.days));
    }
    setOpen(false);
  };

  const applyCustom = () => {
    if (localFrom && localTo) {
      onCustomChange(localFrom, localTo);
      setOpen(false);
    }
  };

  // Display label
  const displayLabel = customFrom && customTo
    ? `${customFrom} ~ ${customTo}`
    : PRESETS.find(p => String(p.days) === dateRange)?.label || `最近 ${dateRange} 天`;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors">
        <CalendarDays size={14} className="text-gray-500" />
        <span className="text-gray-700">{displayLabel}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-3 space-y-3">
          {/* Presets */}
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">快速選擇</div>
            <div className="grid grid-cols-2 gap-1">
              {PRESETS.map((p, i) => (
                <button key={i} onClick={() => handlePreset(p)}
                  className="text-xs text-left px-2.5 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom range */}
          <div className="border-t border-gray-100 pt-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">自訂日期範圍</div>
            <div className="flex gap-2 items-center">
              <input type="date" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                value={localFrom} onChange={e => setLocalFrom(e.target.value)} />
              <span className="text-xs text-gray-400">至</span>
              <input type="date" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                value={localTo} onChange={e => setLocalTo(e.target.value)} />
            </div>
            <button onClick={applyCustom} disabled={!localFrom || !localTo}
              className="mt-2 w-full bg-indigo-600 text-white text-xs py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              套用
            </button>
          </div>
        </div>
      )}
    </div>
  );
}