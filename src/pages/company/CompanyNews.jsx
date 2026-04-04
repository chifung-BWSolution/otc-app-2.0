import { useState } from "react";
import { Search } from "lucide-react";

const sampleNews = [
  {
    id: 1,
    title: "公司週年旅行通知 — 5月15至17日出發，全體員工確認出席",
    summary: "今年公司週年旅行定於5月15-17日，請各部門同事盡快確認出席。行程包括酒店住宿、晚宴及各類團隊活動。",
    category: "活動",
    date: "2小時前",
    urgent: true,
    author: "HR部門",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80",
    related: [
      "旅行報名截止日期為4月20日",
      "行程詳情將於下週公佈",
      "如有特殊飲食要求請提前通知HR",
    ],
  },
  {
    id: 2,
    title: "新版費用報銷流程更新",
    summary: "請使用新版P9表格提交申請，舊版月底停用。",
    category: "行政",
    date: "1天前",
    urgent: false,
    author: "行政部",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
  },
  {
    id: 3,
    title: "第一季度最佳員工評選現已開始",
    summary: "請各部門主管於4月10日前提交提名，評選結果將於月底公佈。",
    category: "獎項",
    date: "3天前",
    urgent: false,
    author: "人事部",
    image: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=600&q=80",
  },
  {
    id: 4,
    title: "IT系統週六凌晨維護，服務暫停6小時",
    summary: "本週六凌晨2-6時進行系統維護，請提前備份重要文件。",
    category: "IT",
    date: "4天前",
    urgent: true,
    author: "IT部門",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
  },
  {
    id: 5,
    title: "新同事入職歡迎 — 3名新成員加入市場部",
    summary: "歡迎三位新同事加入！希望大家互相支持，共同成長。",
    category: "公告",
    date: "1週前",
    urgent: false,
    author: "HR部門",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80",
  },
  {
    id: 6,
    title: "公司新福利：彈性上班時間由下月起實施",
    summary: "員工可選擇8:00至10:00之間開始工作，靈活安排日程。",
    category: "行政",
    date: "2週前",
    urgent: false,
    author: "人事部",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
  },
];

const catColor = {
  活動: "text-red-600",
  行政: "text-blue-600",
  獎項: "text-yellow-600",
  IT: "text-purple-600",
  公告: "text-green-600",
};

const categories = ["全部", "活動", "行政", "獎項", "IT", "公告"];

export default function CompanyNews() {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("全部");
  const [featuredId, setFeaturedId] = useState(1);

  const filtered = sampleNews.filter(
    (n) =>
      (selectedCat === "全部" || n.category === selectedCat) &&
      (n.title.includes(search) || n.summary.includes(search))
  );

  const featured = filtered.find((n) => n.id === featuredId) || filtered[0];
  const leftCol = filtered.filter((n) => n.id !== featured?.id).slice(0, 3);
  const rightCol = filtered.filter((n) => n.id !== featured?.id).slice(3);

  return (
    <div className="space-y-3">
      {/* Top bar: search + categories */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-col gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-gray-50"
            placeholder="搜尋公告..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                selectedCat === cat
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-red-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <p>沒有找到相關公告</p>
        </div>
      ) : (
        /* CNN 3-column grid */
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_180px] gap-4 items-start">

          {/* LEFT COLUMN — small stacked cards */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {leftCol.map((news) => (
              <div
                key={news.id}
                onClick={() => setFeaturedId(news.id)}
                className="cursor-pointer group shrink-0 w-44 md:w-auto"
              >
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-28 object-cover group-hover:opacity-90 transition-opacity"
                  />
                </div>
                <p className="text-xs font-bold text-gray-900 mt-1.5 leading-snug group-hover:text-red-600 transition-colors line-clamp-3">
                  {news.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{news.author} · {news.date}</p>
              </div>
            ))}
          </div>

          {/* CENTER — featured big story */}
          {featured && (
            <div>
              <div className={`text-xs font-extrabold uppercase tracking-wider mb-1 ${catColor[featured.category] || "text-red-600"}`}>
                {featured.urgent && "🔴 緊急 · "}{featured.category}
              </div>
              <h2 className="text-xl font-black text-gray-900 leading-tight mb-3">
                {featured.title}
              </h2>
              <div className="relative rounded-xl overflow-hidden shadow-md">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                  <p className="text-white text-sm font-semibold leading-snug">{featured.summary}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 mb-3">by {featured.author} · {featured.date}</p>

              {/* Related / bullet links */}
              {featured.related && (
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  {featured.related.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-600 font-medium hover:underline cursor-pointer">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RIGHT COLUMN — small text+thumb */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {rightCol.map((news) => (
              <div
                key={news.id}
                onClick={() => setFeaturedId(news.id)}
                className="cursor-pointer group shrink-0 w-44 md:w-auto flex md:flex-col gap-2 items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <img
                  src={news.image}
                  alt={news.title}
                  className="w-16 h-14 md:w-full md:h-20 object-cover rounded-lg shrink-0 group-hover:opacity-90 transition-opacity"
                />
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wide ${catColor[news.category] || "text-gray-500"}`}>
                    {news.category}
                  </p>
                  <p className="text-xs font-bold text-gray-900 leading-snug group-hover:text-red-600 transition-colors line-clamp-3">
                    {news.title}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}