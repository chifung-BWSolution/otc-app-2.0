import { useState } from "react";
import { Search, ArrowRight, Filter } from "lucide-react";

const quickLinks = [
  {
    icon: "💡",
    bg: "bg-yellow-50",
    title: "新員工入職指南",
    desc: "從帳戶設置、系統使用到辦公室規則，全面了解公司運作方式。",
  },
  {
    icon: "📋",
    bg: "bg-blue-50",
    title: "行政申請流程",
    desc: "假期、費用報銷、物資借用等各類申請的詳細步驟說明。",
  },
  {
    icon: "🏆",
    bg: "bg-purple-50",
    title: "福利與獎勵制度",
    desc: "了解公司提供的各項員工福利、獎勵計劃及評核標準。",
  },
];

const featured = {
  category: "指南",
  title: "員工手冊 2026：公司政策與日常工作完全指引",
  desc: "本手冊涵蓋公司文化、工作守則、行政流程及各項員工政策，助你快速融入並掌握日常工作所需資訊。",
  image: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=700&q=80",
  tag: "指南",
};

const sideArticles = [
  {
    category: "政策",
    title: "遙距工作申請及注意事項",
    desc: "了解在家工作的申請條件、設備要求及溝通規範。",
  },
  {
    category: "指南",
    title: "如何使用公司內部系統及工具",
    desc: "涵蓋考勤打卡、費用申報、課程系統等各平台使用說明。",
  },
];

const collections = [
  {
    category: "常見問題",
    title: "假期申請 FAQ",
    desc: "年假、病假、事假的申請方式、批核流程及餘額查詢。",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=700&q=80",
    color: "from-orange-400/80",
  },
  {
    category: "常見問題",
    title: "薪酬及花紅 FAQ",
    desc: "出糧日期、薪酬查詢、花紅計算方式及稅務相關問題。",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&q=80",
    color: "from-green-600/80",
  },
  {
    category: "指南",
    title: "IT支援與設備申請",
    desc: "電腦故障報告、軟件申請、網絡問題及IT聯繫方式。",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=700&q=80",
    color: "from-blue-600/80",
  },
  {
    category: "政策",
    title: "保密協議與資料安全守則",
    desc: "公司機密資料處理規範、社交媒體使用政策及數據安全要求。",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=700&q=80",
    color: "from-purple-700/80",
  },
];

const allArticles = [
  { category: "指南", title: "員工手冊 2026：公司政策與日常工作完全指引", tag: "指南" },
  { category: "政策", title: "遙距工作申請及注意事項", tag: "政策" },
  { category: "指南", title: "如何使用公司內部系統及工具", tag: "指南" },
  { category: "常見問題", title: "假期申請 FAQ", tag: "常見問題" },
  { category: "常見問題", title: "薪酬及花紅 FAQ", tag: "常見問題" },
  { category: "指南", title: "IT支援與設備申請", tag: "指南" },
  { category: "政策", title: "保密協議與資料安全守則", tag: "政策" },
  { category: "常見問題", title: "試用期考核標準與轉正流程", tag: "常見問題" },
  { category: "政策", title: "辦公室行為守則與著裝要求", tag: "政策" },
  { category: "指南", title: "新同事報到第一天流程", tag: "指南" },
];

const tags = ["全部", "指南", "政策", "常見問題"];
const tagBg = { 指南: "bg-blue-100 text-blue-700", 政策: "bg-purple-100 text-purple-700", 常見問題: "bg-orange-100 text-orange-700" };

export default function CompanyFAQ() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("全部");
  const [showAll, setShowAll] = useState(false);

  const filteredArticles = allArticles.filter(
    (a) =>
      (activeTag === "全部" || a.tag === activeTag) &&
      a.title.includes(search)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">公司資源庫</h1>
          <p className="text-gray-500 mt-1 text-sm">瀏覽為員工精選的指南、政策及常見問題解答。</p>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-2 border-2 border-gray-800 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Filter size={15} /> 篩選內容
        </button>
      </div>

      {/* Filter bar (toggle) */}
      {showAll && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
              placeholder="搜尋..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(t)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                activeTag === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-300 hover:border-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Filtered article list */}
      {(search || activeTag !== "全部") ? (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredArticles.map((a, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer group">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tagBg[a.tag] || "bg-gray-100 text-gray-600"}`}>{a.tag}</span>
              <h3 className="font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors text-sm leading-snug">{a.title}</h3>
            </div>
          ))}
          {filteredArticles.length === 0 && <p className="text-gray-400 text-sm col-span-2">沒有符合條件的文章</p>}
        </div>
      ) : (
        <>
          {/* Quick links row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-y border-gray-200 py-6">
            {quickLinks.map((ql, i) => (
              <div key={i} className="flex items-start gap-4 cursor-pointer group">
                <div className={`w-14 h-14 ${ql.bg} rounded-xl flex items-center justify-center text-2xl shrink-0`}>{ql.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{ql.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{ql.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Featured + side articles */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
            {/* Featured big */}
            <div className="cursor-pointer group">
              <div className="rounded-2xl overflow-hidden">
                <img src={featured.image} alt={featured.title} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{featured.category}</span>
                <h2 className="text-xl font-black text-gray-900 mt-1 leading-tight group-hover:text-blue-600 transition-colors">{featured.title}</h2>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{featured.desc}</p>
                <button className="flex items-center gap-1 text-sm font-bold text-gray-900 mt-3 hover:gap-2 transition-all">
                  閱讀更多 <ArrowRight size={15} />
                </button>
              </div>
            </div>

            {/* Side articles */}
            <div className="space-y-6 divide-y divide-gray-100">
              {sideArticles.map((a, i) => (
                <div key={i} className={`cursor-pointer group ${i > 0 ? "pt-6" : ""}`}>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{a.category}</span>
                  <h3 className="font-black text-gray-900 mt-1 text-base leading-snug group-hover:text-blue-600 transition-colors">{a.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-snug">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Collection cards */}
          <div>
            <h2 className="text-lg font-black text-gray-900 mb-4">熱門資源集合</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collections.map((col, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden cursor-pointer group h-48">
                  <img src={col.image} alt={col.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${col.color} to-transparent`} />
                  <div className="absolute bottom-0 left-0 p-4">
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wide">{col.category}</span>
                    <h3 className="font-black text-white text-base mt-0.5 leading-snug">{col.title}</h3>
                    <p className="text-xs text-white/80 mt-0.5 line-clamp-2">{col.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}