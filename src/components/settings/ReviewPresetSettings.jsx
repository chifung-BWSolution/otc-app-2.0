import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

const CATEGORIES = [
  { key: "difficulty", label: "⚡ 遇到的困難", color: "orange" },
  { key: "company_support", label: "🤝 需要公司協助", color: "blue" },
  { key: "goal", label: "🎯 未來一年目標", color: "green" },
  { key: "commitment", label: "💪 願意做的事", color: "purple" },
];

export default function ReviewPresetSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("difficulty");
  const [toggling, setToggling] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ReviewPreset.list("sort_order", 500);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => i.category === activeTab);

  const handleToggle = async (item) => {
    setToggling(item.id);
    const newActive = item.is_active === false ? true : false;
    await base44.entities.ReviewPreset.update(item.id, { is_active: newActive });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: newActive } : i));
    setToggling(null);
  };

  const catInfo = CATEGORIES.find(c => c.key === activeTab);

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">管理年度評估表中「困難」「公司協助」「目標」「願意做的事」的預設選項，員工可一鍵點選。</p>

      {/* Category tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveTab(c.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors min-w-[100px] ${
              activeTab === c.key ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {c.label}
            <span className="ml-1 opacity-60">({items.filter(i => i.category === c.key).length})</span>
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span className="flex-1">{catInfo?.label} 選項</span>
          <span className="w-16 text-center">排序</span>
          <span className="w-24 text-center">狀態</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">尚無選項</div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <span className={`flex-1 text-sm ${item.is_active !== false ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{item.label}</span>
              <span className="w-16 text-center text-xs text-gray-400">{item.sort_order || 0}</span>
              <div className="w-24 flex justify-center">
                <button
                  onClick={() => handleToggle(item)}
                  disabled={toggling === item.id}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    item.is_active !== false
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {toggling === item.id ? <Loader2 size={12} className="animate-spin inline" /> : item.is_active !== false ? '啟用中' : '已停用'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-gray-400">💡 只能啟用或停用選項，停用後員工將無法選擇該選項。</p>
    </div>
  );
}