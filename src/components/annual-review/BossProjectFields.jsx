import { DollarSign, Hash } from "lucide-react";

export default function BossProjectFields({ gpFields, tenderFields, onGpChange, onTenderChange, readOnly }) {
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
    const hasGp = gpFields.some(f => f.amount > 0);
    const hasTender = tenderFields.some(f => f.count > 0);
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
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
        <div className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1"><DollarSign size={13} /> 附加欄位 I</div>
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
      </div>

      {/* Tender Fields */}
      <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
        <div className="text-xs font-bold text-sky-700 mb-3 flex items-center gap-1"><Hash size={13} /> 附加欄位 II</div>
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
      </div>
    </div>
  );
}