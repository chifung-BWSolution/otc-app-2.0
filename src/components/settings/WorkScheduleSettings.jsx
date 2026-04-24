import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, Clock, RefreshCw } from "lucide-react";

const TIME_FIELDS = [
  { key: "work_start", label: "上班時間", default: "09:00" },
  { key: "lunch_start", label: "午餐開始", default: "12:00" },
  { key: "lunch_end", label: "午餐結束", default: "13:00" },
  { key: "work_end", label: "下班時間（平日）", default: "18:30" },
  { key: "sat_training_end", label: "星期六培訓結束", default: "13:30" },
];

export default function WorkScheduleSettings() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [forms, setForms] = useState({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.Region.filter({ is_active: true }, "sort_order", 50);
    setRegions(list);
    const fm = {};
    for (const r of list) {
      fm[r.id] = {};
      for (const f of TIME_FIELDS) {
        fm[r.id][f.key] = r[f.key] || f.default;
      }
    }
    setForms(fm);
    setLoading(false);
  };

  const handleChange = (regionId, field, value) => {
    setForms(prev => ({
      ...prev,
      [regionId]: { ...prev[regionId], [field]: value },
    }));
  };

  const handleSave = async (region) => {
    setSaving(region.id);
    await base44.entities.Region.update(region.id, forms[region.id]);
    setSaving(null);
  };

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSyncRegion = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await base44.functions.invoke('populateStaffRegion', {});
    setSyncResult(res.data);
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500">
        設定各地區辦公室的上下班時間，用於計算遲到分鐘及自願加班時數。
      </div>

      {/* Sync staff_region button */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-indigo-800">🔄 同步員工地區</div>
          <div className="text-xs text-indigo-600 mt-0.5">根據員工的 Base Location 自動填寫 staff_region 欄位</div>
          {syncResult && (
            <div className="text-xs text-indigo-700 mt-1 font-medium">
              ✅ 完成：共 {syncResult.total} 人，已更新 {syncResult.updated} 人，跳過 {syncResult.skipped} 人
            </div>
          )}
        </div>
        <button
          onClick={handleSyncRegion}
          disabled={syncing}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
        >
          {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {syncing ? '同步中...' : '立即同步'}
        </button>
      </div>

      {regions.map(region => (
        <div key={region.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <span className="text-lg">{region.icon || "🏢"}</span>
            <span className="font-bold text-sm text-gray-800">{region.name}</span>
            <span className="text-xs text-gray-400">({region.code})</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {TIME_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="text-[11px] font-medium text-gray-500 block mb-1">{f.label}</label>
                  <div className="relative">
                    <Clock size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
                    <input
                      type="time"
                      className="w-full border border-gray-200 rounded-lg pl-7 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={forms[region.id]?.[f.key] || f.default}
                      onChange={e => handleChange(region.id, f.key, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={() => handleSave(region)}
                disabled={saving === region.id}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving === region.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                儲存
              </button>
            </div>
          </div>
        </div>
      ))}

      {regions.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          請先在「地區管理」頁面新增地區
        </div>
      )}
    </div>
  );
}