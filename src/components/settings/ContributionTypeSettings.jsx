import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function ContributionTypeSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ContributionType.list("sort_order", 100);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (item) => {
    setToggling(item.id);
    await base44.entities.ContributionType.update(item.id, { is_active: !item.is_active });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    setToggling(null);
  };

  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">載入中...</div>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">管理「貢獻重點」的類型選項，員工填寫年度評估表時需先選擇類型再填寫內容。</p>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span className="w-10">圖標</span>
          <span className="flex-1 ml-2">名稱</span>
          <span className="flex-1">說明</span>
          <span className="w-16 text-center">排序</span>
          <span className="w-24 text-center">狀態</span>
        </div>
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <span className="w-10 text-lg">{item.icon || "🔧"}</span>
            <span className={`flex-1 font-medium text-sm ml-2 ${item.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{item.name}</span>
            <span className={`flex-1 text-xs ${item.is_active ? 'text-gray-400' : 'text-gray-300'}`}>{item.description || "—"}</span>
            <span className="w-16 text-center text-xs text-gray-400">{item.sort_order || 0}</span>
            <div className="w-24 flex justify-center">
              <button
                onClick={() => handleToggle(item)}
                disabled={toggling === item.id}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  item.is_active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {toggling === item.id ? <Loader2 size={12} className="animate-spin inline" /> : item.is_active ? '啟用中' : '已停用'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">💡 只能啟用或停用類型，停用後員工將無法選擇該類型。</p>
    </div>
  );
}