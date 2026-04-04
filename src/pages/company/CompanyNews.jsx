import { useState } from "react";
import { Plus, Search, Tag } from "lucide-react";

const sampleNews = [
  { id: 1, title: "🎉 公司週年旅行通知", category: "活動", date: "2026-04-03", urgent: true, content: "今年公司週年旅行定於5月15-17日，請各部門同事盡快確認出席。", author: "HR部門" },
  { id: 2, title: "📋 新版費用報銷流程更新", category: "行政", date: "2026-04-01", urgent: false, content: "費用報銷系統已更新，請使用新版P9表格提交申請。所有舊版表格將於月底停止使用。", author: "行政部" },
  { id: 3, title: "🏆 季度最佳員工評選", category: "獎項", date: "2026-03-28", urgent: false, content: "第一季度最佳員工評選現已開始，請各部門主管於4月10日前提交提名。", author: "人事部" },
  { id: 4, title: "💻 IT系統維護通知", category: "IT", date: "2026-03-25", urgent: true, content: "本週六凌晨2-6時將進行系統維護，期間所有系統暫停服務。", author: "IT部門" },
];

const categories = ["全部", "活動", "行政", "獎項", "IT", "公告"];

export default function CompanyNews() {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("全部");
  const [selected, setSelected] = useState(null);

  const filtered = sampleNews.filter(
    (n) =>
      (selectedCat === "全部" || n.category === selectedCat) &&
      (n.title.includes(search) || n.content.includes(search))
  );

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="搜尋公告..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
            <Plus size={16} /> 發布公告
          </button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCat === cat ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News List */}
      <div className="grid gap-3">
        {filtered.map((news) => (
          <div
            key={news.id}
            onClick={() => setSelected(selected?.id === news.id ? null : news)}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {news.urgent && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">🔴 緊急</span>}
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    <Tag size={10} className="inline mr-1" />{news.category}
                  </span>
                  <span className="text-xs text-gray-400">{news.date}</span>
                </div>
                <h3 className="font-semibold text-gray-800 mt-1">{news.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">by {news.author}</p>
                {selected?.id === news.id && (
                  <p className="text-sm text-gray-700 mt-3 p-3 bg-gray-50 rounded-lg">{news.content}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p>沒有找到相關公告</p>
          </div>
        )}
      </div>
    </div>
  );
}