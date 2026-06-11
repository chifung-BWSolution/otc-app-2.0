import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

const CATEGORY_LABELS = { merit: "功", demerit: "過" };
const CATEGORY_COLORS = {
  merit: "bg-green-100 text-green-700",
  demerit: "bg-red-100 text-red-700",
};

export default function MeritDemeritTypeSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.MeritDemeritType.list("sort_order", 100);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (item) => {
    setToggling(item.id);
    const newActive = item.is_active === false ? true : false;
    await base44.entities.MeritDemeritType.update(item.id, { is_active: newActive });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: newActive } : i));
    setToggling(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8 text-gray-400"><Loader2 size={20} className="animate-spin" /></div>;
  }

  const demerits = items.filter(i => i.category === "demerit");
  const merits = items.filter(i => i.category === "merit");

  const renderRow = (item) => (
    <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <div className={`w-2 h-2 rounded-full shrink-0 ${item.is_active !== false ? 'bg-green-400' : 'bg-gray-300'}`} />
      <span className={`font-medium text-sm w-24 ${item.is_active !== false ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{item.name}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category]}`}>
        {CATEGORY_LABELS[item.category]}
      </span>
      <span className={`text-sm font-bold w-16 text-center ${item.is_active !== false ? (item.score_adjustment >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-300'}`}>
        {item.score_adjustment >= 0 ? '+' : ''}{item.score_adjustment}
      </span>
      <span className="text-xs text-gray-400 w-12 text-center">{item.sort_order}</span>
      <div className="flex-1" />
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
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">設定功過類型及其對應的分數調整。</p>

      {/* Demerits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-100">
          <span className="text-sm font-bold text-red-700">❌ 過（扣分）</span>
        </div>
        <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 w-2"></span>
          <span className="text-xs font-bold text-gray-400 w-24">名稱</span>
          <span className="text-xs font-bold text-gray-400 w-12">分類</span>
          <span className="text-xs font-bold text-gray-400 w-16 text-center">分數</span>
          <span className="text-xs font-bold text-gray-400 w-12 text-center">排序</span>
          <span className="flex-1" />
          <span className="text-xs font-bold text-gray-400 w-16 text-center">狀態</span>
        </div>
        {demerits.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">暫無資料</div>
        ) : (
          demerits.map(renderRow)
        )}
      </div>

      {/* Merits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 bg-green-50 border-b border-green-100">
          <span className="text-sm font-bold text-green-700">✅ 功（加分）</span>
        </div>
        <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 w-2"></span>
          <span className="text-xs font-bold text-gray-400 w-24">名稱</span>
          <span className="text-xs font-bold text-gray-400 w-12">分類</span>
          <span className="text-xs font-bold text-gray-400 w-16 text-center">分數</span>
          <span className="text-xs font-bold text-gray-400 w-12 text-center">排序</span>
          <span className="flex-1" />
          <span className="text-xs font-bold text-gray-400 w-16 text-center">狀態</span>
        </div>
        {merits.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">暫無資料</div>
        ) : (
          merits.map(renderRow)
        )}
      </div>

      <p className="text-xs text-gray-400">💡 只能啟用或停用功過類型，停用後將無法再記錄該類型。</p>
    </div>
  );
}