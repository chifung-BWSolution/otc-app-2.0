import { useState } from "react";
import { Search, Star, Clock, Users } from "lucide-react";

const courses = [
  { id: 1, title: "領導力基礎培訓", category: "管理", duration: "8小時", rating: 4.8, enrolled: 45, progress: 60, icon: "👑", color: "from-yellow-400 to-orange-400" },
  { id: 2, title: "Microsoft Excel 進階", category: "IT技能", duration: "6小時", rating: 4.6, enrolled: 72, progress: 100, icon: "📊", color: "from-green-400 to-teal-400" },
  { id: 3, title: "客戶服務技巧", category: "溝通", duration: "4小時", rating: 4.9, enrolled: 88, progress: 0, icon: "🤝", color: "from-blue-400 to-purple-400" },
  { id: 4, title: "財務基礎知識", category: "財務", duration: "10小時", rating: 4.5, enrolled: 34, progress: 30, icon: "💰", color: "from-pink-400 to-red-400" },
  { id: 5, title: "項目管理PMP入門", category: "管理", duration: "12小時", rating: 4.7, enrolled: 29, progress: 0, icon: "🚀", color: "from-indigo-400 to-blue-400" },
  { id: 6, title: "商務英語溝通", category: "語言", duration: "8小時", rating: 4.4, enrolled: 56, progress: 75, icon: "🌐", color: "from-teal-400 to-cyan-400" },
];

const categories = ["全部", "管理", "IT技能", "溝通", "財務", "語言"];

export default function CourseCenter() {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("全部");
  const [tab, setTab] = useState("all");

  const filtered = courses.filter((c) =>
    (selectedCat === "全部" || c.category === selectedCat) &&
    c.title.includes(search) &&
    (tab === "all" || (tab === "inProgress" && c.progress > 0 && c.progress < 100) || (tab === "completed" && c.progress === 100))
  );

  return (
    <div className="space-y-4">
      {/* My Progress Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">6</div>
          <div className="text-xs text-gray-500 mt-0.5">已報名課程</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-600">1</div>
          <div className="text-xs text-gray-500 mt-0.5">已完成課程</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
          <div className="text-2xl font-bold text-purple-600">34h</div>
          <div className="text-xs text-gray-500 mt-0.5">總學習時數</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
          placeholder="搜尋課程..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {[{ key: "all", label: "全部課程" }, { key: "inProgress", label: "進行中" }, { key: "completed", label: "已完成" }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? "bg-white shadow text-teal-600" : "text-gray-500"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCat === cat ? "bg-teal-500 text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((course) => (
          <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className={`bg-gradient-to-r ${course.color} p-4 text-white`}>
              <div className="flex items-center justify-between">
                <span className="text-3xl">{course.icon}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{course.category}</span>
              </div>
              <h3 className="font-bold mt-2">{course.title}</h3>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1"><Clock size={12} />{course.duration}</span>
                <span className="flex items-center gap-1"><Users size={12} />{course.enrolled}人已報名</span>
                <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400" />{course.rating}</span>
              </div>
              {course.progress > 0 && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>學習進度</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${course.progress === 100 ? "bg-green-400" : "bg-blue-400"}`} style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
              )}
              <button className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                course.progress === 100
                  ? "bg-green-100 text-green-600"
                  : course.progress > 0
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-teal-500 text-white hover:bg-teal-600"
              }`}>
                {course.progress === 100 ? "✅ 已完成" : course.progress > 0 ? "▶ 繼續學習" : "📚 立即報名"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}