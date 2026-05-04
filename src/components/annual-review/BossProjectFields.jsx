import { DollarSign, Hash, EyeOff } from "lucide-react";

export default function BossProjectFields({ gpFields, tenderFields, onGpChange, onTenderChange, readOnly, gpDisabled, tenderDisabled, onGpDisabledChange, onTenderDisabledChange }) {

  const updateGp = (idx, field, value) => {
    const next = [...gpFields];
    next[idx] = { ...next[idx], [field]: value };
    onGpChange(next);
  };
  const updateTender = (idx, field, value) => {
    const next = [...tenderFields];
    next[idx] = { ...next[idx], [field]: value };
    onTenderChange(next);
  };

  if (readOnly) {
    const hasGp = !gpDisabled && gpFields.some(f => f.amount > 0);
    const hasTender = !tenderDisabled && tenderFields.some(f => f.count > 0);
    if (!hasGp && !hasTender) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {hasGp && (
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1"><DollarSign size={13} /> 附加欄位 I</div>
            {gpFields.map((f, i) => f.amount > 0 && (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <span className="text-gray-700">{f.label}</span>
                <span className="font-bold text-emerald-700">${f.amount?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
        {hasTender && (
          <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
            <div className="text-xs font-bold text-sky-700 mb-2 flex items-center gap-1"><Hash size={13} /> 附加欄位 II</div>
            {tenderFields.map((f, i) => f.count > 0 && (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <span className="text-gray-700">{f.label}</span>
                <span className="font-bold text-sky-700">{f.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* GP Fields */}
      <div className={`rounded-xl p-4 border ${gpDisabled ? "bg-gray-50 border-gray-200" : "bg-emerald-50 border-emerald-200"}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <DollarSign size={13} /> 附加欄位 I
          </div>
          {onGpDisabledChange && (
            <button
              onClick={() => onGpDisabledChange(!gpDisabled)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                gpDisabled
                  ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  : "bg-emerald-200 text-emerald-700 hover:bg-emerald-300"
              }`}
            >
              <EyeOff size={11} />
              {gpDisabled ? "不適用" : "不適用"}
            </button>
          )}
        </div>
        {gpDisabled ? (
          <div className="text-sm text-gray-400 text-center py-2 italic">已標記為不適用</div>
        ) : (
          <div className="space-y-2.5">
            {gpFields.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="flex-1 border border-emerald-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                  value={f.label}
                  onChange={e => updateGp(i, "label", e.target.value)}
                  placeholder="標籤"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-emerald-500 text-sm font-bold">$</span>
                  <input
                    type="number"
                    className="w-32 border border-emerald-200 rounded-lg pl-7 pr-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white font-semibold"
                    value={f.amount || ""}
                    onChange={e => updateGp(i, "amount", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tender Fields */}
      <div className={`rounded-xl p-4 border ${tenderDisabled ? "bg-gray-50 border-gray-200" : "bg-sky-50 border-sky-200"}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-sky-700 flex items-center gap-1">
            <Hash size={13} /> 附加欄位 II
          </div>
          {onTenderDisabledChange && (
            <button
              onClick={() => onTenderDisabledChange(!tenderDisabled)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                tenderDisabled
                  ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  : "bg-sky-200 text-sky-700 hover:bg-sky-300"
              }`}
            >
              <EyeOff size={11} />
              {tenderDisabled ? "不適用" : "不適用"}
            </button>
          )}
        </div>
        {tenderDisabled ? (
          <div className="text-sm text-gray-400 text-center py-2 italic">已標記為不適用</div>
        ) : (
          <div className="space-y-2.5">
            {tenderFields.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="flex-1 border border-sky-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
                  value={f.label}
                  onChange={e => updateTender(i, "label", e.target.value)}
                  placeholder="標籤"
                />
                <input
                  type="number"
                  className="w-24 border border-sky-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white font-semibold text-center"
                  value={f.count || ""}
                  onChange={e => updateTender(i, "count", parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}