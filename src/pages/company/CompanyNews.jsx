import { useState } from "react";
import { Search, Bookmark, Share2, ChevronRight } from "lucide-react";

const sampleNews = [
  {
    id: 1,
    title: "公司週年旅行通知 — 5月15至17日出發",
    category: "活動",
    date: "2小時前",
    urgent: true,
    content: "今年公司週年旅行定於5月15-17日，請各部門同事盡快確認出席。行程包括酒店住宿、晚宴及團隊活動。",
    author: "HR部門",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    tag_color: "bg-red-100 text-red-600",
  },
  {
    id: 2,
    title: "新版費用報銷流程更新，舊版表格月底停用",
    category: "行政",
    date: "1天前",
    urgent: false,
    content: "費用報銷系統已更新，請使用新版P9表格提交申請。所有舊版表格將於月底停止使用。",
    author: "行政部",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    tag_color: "bg-blue-100 text-blue-600",
  },
  {
    id: 3,
    title: "第一季度最佳員工評選現已開始",
    category: "獎項",
    date: "3天前",
    urgent: false,
    content: "第一季度最佳員工評選現已開始，請各部門主管於4月10日前提交提名。",
    author: "人事部",
    image: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&q=80",
    tag_color: "bg-yellow-100 text-yellow-700",
  },
  {
    id: 4,
    title: "本週六凌晨 IT 系統維護，服務暫停6小時",
    category: "IT",
    date: "4天前",
    urgent: true,
    content: "本週六凌晨2-6時將進行系統維護，期間所有系統暫停服務。請提前做好備份工作。",
    author: "IT部門",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    tag_color: "bg-purple-100 text-purple-600",
  },
  {
    id: 5,
    title: "新同事入職歡迎 — 3名新成員加入市場部",
    category: "公告",
    date: "1週前",
    urgent: false,
    content: "歡迎三位新同事加入市場部！希望大家互相支持，共同成長。",
    author: "HR部門",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80",
    tag_color: "bg-green-100 text-green-700",
  },
  {
    id: 6,
    title: "公司新福利政策：彈性上班時間安排",
    category: "行政",
    date: "2週前",
    urgent: false,
    content: "人力資源部宣布，由下月起推行彈性上班時間政策，員工可選擇8:00至10:00之間開始工作。",
    author: "人事部",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    tag_color: "bg-teal-100 text-teal-700",
  },
];

const categories = ["全部", "活動", "行政", "獎項", "IT", "公告"];

export default function CompanyNews() {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("全部");
  const [expanded, setExpanded] = useState(null);

  const filtered = sampleNews.filter(
    (n) =>
      (selectedCat === "全部" || n.category === selectedCat) &&
      (n.title.includes(search) || n.content.includes(search))
  );

  const [featured, ...rest] = filtered;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
          placeholder="搜尋公告..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCat === cat
                ? "bg-blue-600 text-white border-blue-600 shadow"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <p>沒有找到相關公告</p>
        </div>
      )}

      {/* Featured Hero Card */}
      {featured && (
        <div
          className="relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow group"
          onClick={() => setExpanded(expanded === featured.id ? null : featured.id)}
        >
          <img
            src={featured.image}
            alt={featured.title}
            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              {featured.urgent && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">🔴 緊急</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${featured.tag_color}`}>{featured.category}</span>
              <span className="text-xs opacity-70">{featured.date}</span>
            </div>
            <h2 className="font-bold text-lg leading-snug drop-shadow">{featured.title}</h2>
            <p className="text-xs opacity-70 mt-1">by {featured.author}</p>
          </div>
          {expanded === featured.id && (
            <div className="relative bg-white p-4 text-sm text-gray-700 border-t border-gray-100">
              {featured.content}
            </div>
          )}
        </div>
      )}

      {/* Remaining News List — Google News style */}
      <div className="space-y-3">
        {rest.map((news) => (
          <div
            key={news.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setExpanded(expanded === news.id ? null : news.id)}
          >
            <div className="flex gap-3 p-3">
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {news.urgent && (
                    <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-semibold">🔴 緊急</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${news.tag_color}`}>{news.category}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{news.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                  <span>{news.author}</span>
                  <span>·</span>
                  <span>{news.date}</span>
                </div>
              </div>
              {/* Thumbnail */}
              <img
                src={news.image}
                alt={news.title}
                className="w-24 h-20 object-cover rounded-xl shrink-0"
              />
            </div>

            {/* Expanded Content */}
            {expanded === news.id && (
              <div className="px-4 pb-4 text-sm text-gray-700 border-t border-gray-50 pt-3">
                {news.content}
                <div className="flex gap-3 mt-3">
                  <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors">
                    <Bookmark size={13} /> 收藏
                  </button>
                  <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors">
                    <Share2 size={13} /> 分享
                  </button>
                  <button className="flex items-center gap-1 text-xs text-blue-500 ml-auto font-medium">
                    查看全文 <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}