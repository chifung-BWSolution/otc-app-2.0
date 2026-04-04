import { useState } from "react";
import { ChevronLeft, ChevronRight, Bookmark, Share2, ExternalLink } from "lucide-react";

const heroNews = [
  {
    id: 1,
    title: "OpenAI 發布 GPT-5：推理能力全面躍升，多模態處理達人類水平",
    category: "AI",
    tag: "頭條",
    time: "1小時前",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80",
  },
  {
    id: 2,
    title: "Apple Vision Pro 第二代發布：更輕薄、電池續航提升至8小時",
    category: "硬件",
    tag: "精選",
    time: "3小時前",
    image: "https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=1200&q=80",
  },
  {
    id: 3,
    title: "Google 推出新一代量子處理器，運算速度較前代提升100倍",
    category: "科學",
    tag: "精選",
    time: "6小時前",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
  },
];

const tabs = ["最新", "AI", "硬件", "軟件", "科學", "安全", "手機"];

const allNews = [
  { id: 1, title: "OpenAI 發布 GPT-5：推理能力全面躍升", category: "AI", time: "1小時前", hot: true, image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80", source: "The Verge" },
  { id: 2, title: "Apple Vision Pro 第二代發布：更輕薄電池更持久", category: "硬件", time: "3小時前", hot: false, image: "https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=600&q=80", source: "9to5Mac" },
  { id: 3, title: "Google 量子處理器突破：運算速度提升100倍", category: "科學", time: "6小時前", hot: true, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80", source: "Wired" },
  { id: 4, title: "Meta 推出全新 AR 眼鏡，售價低於$3,000", category: "硬件", time: "8小時前", hot: false, image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=600&q=80", source: "TechCrunch" },
  { id: 5, title: "微軟 Windows 12 正式發布：AI 功能全面整合", category: "軟件", time: "1天前", hot: false, image: "https://images.unsplash.com/photo-1633174524827-db00a6b7bc74?w=600&q=80", source: "ZDNet" },
  { id: 6, title: "新型勒索軟件席捲全球，逾500家企業受波及", category: "安全", time: "1天前", hot: true, image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80", source: "Krebs on Security" },
  { id: 7, title: "Samsung Galaxy S26 規格曝光：200MP主攝及鈦合金機身", category: "手機", time: "2天前", hot: false, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80", source: "GSMArena" },
  { id: 8, title: "特斯拉 Optimus 機械人正式投入工廠生產線", category: "AI", time: "2天前", hot: true, image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80", source: "Electrek" },
  { id: 9, title: "蘋果自研 5G 芯片首次亮相，性能超越高通", category: "硬件", time: "3天前", hot: false, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&q=80", source: "MacRumors" },
];

const catColor = { AI: "text-violet-500", 硬件: "text-blue-500", 軟件: "text-teal-500", 科學: "text-green-500", 安全: "text-red-500", 手機: "text-orange-500" };
const catBg = { AI: "bg-violet-500", 硬件: "bg-blue-500", 軟件: "bg-teal-500", 科學: "bg-green-500", 安全: "bg-red-500", 手機: "bg-orange-500" };

export default function TechNews() {
  const [activeTab, setActiveTab] = useState("最新");

  const filtered = activeTab === "最新" ? allNews : allNews.filter((n) => n.category === activeTab);
  const mainCard = filtered[0];
  const gridCards = filtered.slice(1);

  return (
    <div className="space-y-0 -mx-4 md:-mx-6 -mt-4 md:-mt-6">
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[53px] z-10 px-4 md:px-6">
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === t ? "border-violet-500 text-violet-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-4 space-y-6">
        {mainCard && (
          <div className="cursor-pointer group">
            <div className="relative rounded-2xl overflow-hidden">
              <img src={mainCard.image} alt={mainCard.title} className="w-full h-52 md:h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1">
                  {mainCard.hot && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-bold">🔥 熱門</span>}
                  <span className={`text-xs font-bold ${catColor[mainCard.category] || "text-white"}`}>{mainCard.category}</span>
                </div>
                <h3 className="text-white font-black text-lg leading-snug">{mainCard.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/60 text-xs">{mainCard.source} · {mainCard.time}</span>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"><Bookmark size={13} className="text-white" /></button>
                    <button className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"><Share2 size={13} className="text-white" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gridCards.map((n) => (
            <div key={n.id} className="cursor-pointer group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative overflow-hidden">
                <img src={n.image} alt={n.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                {n.hot && <span className="absolute top-2 left-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded font-bold">🔥</span>}
              </div>
              <div className="p-3">
                <div className={`text-xs font-bold mb-1 ${catColor[n.category] || "text-gray-500"}`}>{n.category}</div>
                <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-violet-600 transition-colors">{n.title}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{n.source} · {n.time}</span>
                  <button className="p-1 hover:text-violet-500 transition-colors"><ExternalLink size={12} className="text-gray-300" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">📡</div>
            <p>沒有相關科技新聞</p>
          </div>
        )}
      </div>
    </div>
  );
}