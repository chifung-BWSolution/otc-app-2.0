import { Plus, X } from "lucide-react";

export default function BossNotesSection({ deptGoals, personalGoals, extraNotes, onDeptGoalsChange, onPersonalGoalsChange, onExtraNotesChange }) {
  const addItem = (list, setter) => setter([...list, ""]);
  const updateItem = (list, setter, idx, val) => {
    const next = [...list];
    next[idx] = val;
    setter(next);
  };
  const removeItem = (list, setter, idx) => {
    const next = [...list];
    next.splice(idx, 1);
    setter(next);
  };

  return (
    <div className="space-y-4">
      {/* 未來部門目標 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-cyan-50 px-4 py-3 border-b border-cyan-100">
          <h3 className="font-bold text-base text-cyan-800">🏢 未來部門目標</h3>
        </div>
        <div className="p-4 space-y-2">
          {deptGoals.map((g, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm font-bold text-cyan-600 shrink-0">{i + 1}.</span>
              <input
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                placeholder="輸入部門目標..."
                value={g}
                onChange={e => updateItem(deptGoals, onDeptGoalsChange, i, e.target.value)}
              />
              <button onClick={() => removeItem(deptGoals, onDeptGoalsChange, i)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => addItem(deptGoals, onDeptGoalsChange)}
            className="flex items-center gap-1.5 text-xs text-cyan-600 font-semibold hover:text-cyan-800 transition-colors mt-1">
            <Plus size={13} /> 新增目標
          </button>
        </div>
      </div>

      {/* 公司設定個人目標 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-violet-50 px-4 py-3 border-b border-violet-100">
          <h3 className="font-bold text-base text-violet-800">🎯 公司設定個人目標</h3>
        </div>
        <div className="p-4 space-y-2">
          {personalGoals.map((g, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm font-bold text-violet-600 shrink-0">{i + 1}.</span>
              <input
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                placeholder="輸入個人目標..."
                value={g}
                onChange={e => updateItem(personalGoals, onPersonalGoalsChange, i, e.target.value)}
              />
              <button onClick={() => removeItem(personalGoals, onPersonalGoalsChange, i)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => addItem(personalGoals, onPersonalGoalsChange)}
            className="flex items-center gap-1.5 text-xs text-violet-600 font-semibold hover:text-violet-800 transition-colors mt-1">
            <Plus size={13} /> 新增目標
          </button>
        </div>
      </div>

      {/* 其它補充 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-bold text-base text-gray-700">📝 其它補充（選填）</h3>
        </div>
        <div className="p-4">
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            rows={4}
            placeholder="其他需要補充的事項..."
            value={extraNotes}
            onChange={e => onExtraNotesChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}