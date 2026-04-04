import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Bookmark, Share2, Play } from "lucide-react";

const heroNews = [
  {
    id: 1,
    title: "公司週年旅行通知 — 5月15至17日出發，全體員工確認出席",
    category: "活動",
    tag: "🔴 緊急",
    time: "2小時前",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
  },
  {
    id: 2,
    title: "第一季度最佳員工評選現已開始，請於4月10日前提交提名",
    category: "獎項",
    tag: "精選",
    time: "1天前",
    image: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=1200&q=80",
  },
  {
    id: 3,
    title: "公司新福利：彈性上班時間由下月起實施，員工可選擇8:00至10:00開始",
    category: "行政",
    tag: "精選",
    time: "2天前",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
  },
];

const tabs = ["最新", "行政", "活動", "IT", "獎項", "公告"];

const allNews = [
  { id: 1, title: "公司週年旅行通知 — 5月15至17日出發", category: "活動", time: "2小時前", urgent: true, image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80", author: "HR部門" },
  { id: 2, title: "新版費用報銷流程更新，請使用新版P9表格", category: "行政", time: "1天前", urgent: false, image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80", author: "行政部" },
  { id: 3, title: "第一季度最佳員工評選現已開始", category: "獎項", time: "3天前", urgent: false, image: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=600&q=80", author: "人事部" },
  { id: 4, title: "IT系統週六凌晨維護，服務暫停6小時", category: "IT", time: "4天前", urgent: true, image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80", author: "IT部門" },
  { id: 5, title: "新同事入職歡迎 — 3名新成員加入市場部", category: "公告", time: "1週前", urgent: false, image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80", author: "HR部門" },
  { id: 6, title: "公司新福利：彈性上班時間由下月起實施", category: "行政", time: "2週前", urgent: false, image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80", author: "人事部" },
  { id: 7, title: "年度培訓日程公佈，請各部門安排出席", category: "活動", time: "2週前", urgent: false, image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80", author: "培訓部" },
  { id: 8, title: "辦公室冷氣系統維修通知", category: "行政", time: "3週前", urgent: false, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80", author: "行政部" },
  { id: 9, title: "公司慈善跑步活動報名開始", category: "活動", time: "1個月前", urgent: false, image: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=600&q=80", author: "HR部門" },
];

const catColor = { 活動: "text-red-500", 行政: "text-blue-500", 獎項: "text-yellow-500", IT: "text-purple-500", 公告: "text-green-500" };
const catBg = { 活動: "bg-red-500", 行政: "bg-blue-500", 獎項: "bg-yellow-500", IT: "bg-purple-500", 公告: "bg-green-500" };

export default function CompanyNews() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("最新");
  const autoRef = useRef(null);

  useEffect(() => {
    autoRef.current = setInterval(() => setHeroIdx((i) => (i + 1) % heroNews.length), 5000);
    return () => clearInterval(autoRef.current);
  }, []);

  const goHero = (dir) => {
    clearInterval(autoRef.current);
    setHeroIdx((i) => (i + dir + heroNews.length) % heroNews.length);
  };

  const filtered = activeTab === "最新" ? allNews : allNews.filter((n) => n.category === activeTab);
  const mainCard = filtered[0];
  const gridCards = filtered.slice(1);

  return (
    <div className="space-y-0 -mx-4 md:-mx-6 -mt-4 md:-mt-6">
      {/* ── Hero Carousel ───────────────────────────── */}
      <div className="relative bg-black overflow-hidden" style={{ height: 340 }}>
        {heroNews.map((n, i) => (
          <div
            key={n.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === heroIdx ? "opacity-100" : "opacity-0"}`}
          >
            <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${catBg[n.category] || "bg-gray-500"} text-white`}>{n.category}</span>
                {n.tag && <span className="text-xs text-white/70">{n.tag}</span>}
                <span className="text-xs text-white/50 ml-auto">{n.time}</span>
              </div>
              <h2 className="text-white font-black text-lg md:text-xl leading-snug line-clamp-2">{n.title}</h2>
            </div>
          </div>
        ))}
        {/* Arrows */}
        <button onClick={() => goHero(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors z-10">
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => goHero(1)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors z-10">
          <ChevronRight size={18} />
        </button>
        {/* Dots */}
        <div className="absolute bottom-3 right-5 flex gap-1.5 z-10">
          {heroNews.map((_, i) => (
            <button key={i} onClick={() => setHeroIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === heroIdx ? "bg-white w-4" : "bg-white/50"}`} />
          ))}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-[53px] z-10 px-4 md:px-6">
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === t ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div className="px-4 md:px-6 py-4 space-y-6">
        {/* Big featured card */}
        {mainCard && (
          <div className="cursor-pointer group">
            <div className="relative rounded-2xl overflow-hidden">
              <img src={mainCard.image} alt={mainCard.title} className="w-full h-52 md:h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1">
                  {mainCard.urgent && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-bold">緊急</span>}
                  <span className={`text-xs font-bold ${catColor[mainCard.category] || "text-white"}`}>{mainCard.category}</span>
                </div>
                <h3 className="text-white font-black text-lg leading-snug">{mainCard.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/60 text-xs">{mainCard.author} · {mainCard.time}</span>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"><Bookmark size={13} className="text-white" /></button>
                    <button className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"><Share2 size={13} className="text-white" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gridCards.map((n) => (
            <div key={n.id} className="cursor-pointer group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative overflow-hidden">
                <img src={n.image} alt={n.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                {n.urgent && (
                  <span className="absolute top-2 left-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded font-bold">緊急</span>
                )}
              </div>
              <div className="p-3">
                <div className={`text-xs font-bold mb-1 ${catColor[n.category] || "text-gray-500"}`}>{n.category}</div>
                <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">{n.title}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{n.author} · {n.time}</span>
                  <button className="p-1 hover:text-red-500 transition-colors"><Bookmark size={13} className="text-gray-300" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* List rows for remaining */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p>沒有相關公告</p>
          </div>
        )}
      </div>
    </div>
  );
}