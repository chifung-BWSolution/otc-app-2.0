import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Clock, Star, X, LayoutGrid, List, ChevronRight, SlidersHorizontal, ChevronLeft, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const diffColor = ["", "bg-green-100 text-green-700", "bg-lime-100 text-lime-700", "bg-yellow-100 text-yellow-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"];
const METHOD_OPTIONS = ["自學", "課堂", "混合"];

export default function CourseList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [activeUnit, setActiveUnit] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [method, setMethod] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [sortBy, setSortBy] = useState("title");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [courseData, catData] = await Promise.all([
      base44.entities.Course.filter({ status: "已發佈" }, "-created_date", 500),
      base44.entities.CourseCategory.filter({ is_active: true }, "sort_order", 100),
    ]);
    setCourses(courseData);
    setCategories(catData);
    setLoading(false);
  };

  const selectedCat = categories.find(c => c.id === activeCat);
  const availableUnits = selectedCat?.service_units || [];

  const countByCategory = useMemo(() => {
    const map = { all: courses.length };
    courses.forEach(c => { map[c.category_id] = (map[c.category_id] || 0) + 1; });
    return map;
  }, [courses]);

  const filtered = useMemo(() => {
    let list = courses.filter(c => {
      const matchSearch = !search ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.code?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCat === "all" || c.category_id === activeCat;
      const matchUnit = activeUnit === "all" || c.service_units?.includes(activeUnit);
      const matchDiff = difficulty === "all" || c.difficulty === Number(difficulty);
      const matchMethod = method === "all" || c.learning_method === method;
      return matchSearch && matchCat && matchUnit && matchDiff && matchMethod;
    });
    list.sort((a, b) => {
      if (sortBy === "difficulty") return (a.difficulty || 0) - (b.difficulty || 0);
      if (sortBy === "duration") return (a.duration_hours || 0) - (b.duration_hours || 0);
      return (a.title || "").localeCompare(b.title || "");
    });
    return list;
  }, [courses, search, activeCat, activeUnit, difficulty, method, sortBy]);

  const hasFilter = search || activeUnit !== "all" || difficulty !== "all" || method !== "all";
  const activeFilterCount = [activeUnit !== "all", difficulty !== "all", method !== "all"].filter(Boolean).length;

  const clearFilters = () => {
    setSearch(""); setActiveUnit("all"); setDifficulty("all"); setMethod("all");
  };

  if (loading) return <div className="text-center py-16 text-gray-400">載入中...</div>;

  return (
    <div className="space-y-3">
      {/* Search + Filter button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-full text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-300"
            placeholder="搜尋課程名稱、編號、描述..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowFilterPanel(!showFilterPanel)}
          className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center relative transition-colors ${
            showFilterPanel || activeFilterCount > 0 ? "bg-teal-500 text-white border-teal-500" : "bg-white border-gray-200 text-gray-500"
          }`}>
          <SlidersHorizontal size={14} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-800">篩選條件</h4>
            {hasFilter && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                <X size={11} /> 清除全部
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">難度</label>
              <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="all">全部難度</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Level {n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">學習方式</label>
              <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="all">全部方式</option>
                {METHOD_OPTIONS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">排序</label>
              <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="title">按名稱</option>
                <option value="difficulty">按難度</option>
                <option value="duration">按時數</option>
              </select>
            </div>
          </div>
          {availableUnits.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">服務單位</label>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setActiveUnit("all")}
                  className={`text-xs px-2.5 py-1 rounded-md ${activeUnit === "all" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}`}>
                  全部
                </button>
                {availableUnits.map(u => (
                  <button key={u} onClick={() => setActiveUnit(u)}
                    className={`text-xs px-2.5 py-1 rounded-md ${activeUnit === u ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">檢視模式</span>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode("table")}
                className={`px-3 py-1 text-xs flex items-center gap-1 ${viewMode === "table" ? "bg-teal-500 text-white" : "bg-white text-gray-500"}`}>
                <List size={12} /> Table
              </button>
              <button onClick={() => setViewMode("grid")}
                className={`px-3 py-1 text-xs flex items-center gap-1 ${viewMode === "grid" ? "bg-teal-500 text-white" : "bg-white text-gray-500"}`}>
                <LayoutGrid size={12} /> Grid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Total count */}
      <div className="text-sm text-gray-500">
        共 <span className="font-bold text-gray-800">{filtered.length}</span> 個課程
      </div>

      {/* Category Tab Bar (horizontal scroll with arrows) */}
      <CategoryTabBar
        categories={categories}
        activeCat={activeCat}
        setActiveCat={(id) => { setActiveCat(id); setActiveUnit("all"); }}
        countByCategory={countByCategory}
      />

      {/* Empty */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
          <p>暫無符合條件的課程</p>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-600">
                <th className="px-4 py-2.5 text-left font-bold">課程名稱</th>
                <th className="px-4 py-2.5 text-left font-bold">分類</th>
                <th className="px-4 py-2.5 text-left font-bold">服務單位</th>
                <th className="px-4 py-2.5 text-center font-bold">難度</th>
                <th className="px-4 py-2.5 text-center font-bold">時數</th>
                <th className="px-4 py-2.5 text-center font-bold">方式</th>
                <th className="px-4 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const cat = categories.find(x => x.id === c.category_id);
                return (
                  <tr key={c.id} onClick={() => navigate(`/course/${c.id}`)}
                    className="border-b border-gray-50 hover:bg-teal-50/40 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900 text-sm">{c.title}</div>
                      {c.code && <div className="text-xs text-gray-400 mt-0.5">{c.code}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {cat && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <span>{cat.icon || "📚"}</span>
                          <span className="truncate max-w-[90px]">{cat.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {(c.service_units || []).slice(0, 2).map((u, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{u}</span>
                        ))}
                        {(c.service_units || []).length > 2 && (
                          <span className="text-xs text-gray-400 px-1">+{c.service_units.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor[c.difficulty] || "bg-gray-100"}`}>
                        <Star size={9} className="inline mr-0.5" />L{c.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      {c.duration_hours ? `${c.duration_hours}h` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">自學</span>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">課堂</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={14} className="text-gray-300" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => {
            const cat = categories.find(x => x.id === c.category_id);
            return (
              <button key={c.id} onClick={() => navigate(`/course/${c.id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:border-teal-200 transition-all">
                {c.cover_image && <img src={c.cover_image} alt="" className="w-full h-28 object-cover rounded-lg mb-3" />}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <span>{cat?.icon || "📚"}</span> {cat?.name}
                </div>
                <h4 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{c.title}</h4>
                {c.code && <div className="text-xs text-gray-400 mb-2">{c.code}</div>}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor[c.difficulty] || "bg-gray-100"}`}>L{c.difficulty}</span>
                  {c.duration_hours && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{c.duration_hours}h</span>}
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{c.learning_method}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Horizontal Category Tab Bar ---------------- */
function CategoryTabBar({ categories, activeCat, setActiveCat, countByCategory }) {
  const [scrollRef, setScrollRef] = useState(null);

  const scroll = (dir) => {
    if (scrollRef) scrollRef.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-700">
        <ChevronLeft size={14} />
      </button>
      <button onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-700">
        <ChevronRight size={14} />
      </button>
      <div ref={setScrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-9 py-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <CategoryTab
          active={activeCat === "all"}
          onClick={() => setActiveCat("all")}
          icon={<Globe size={24} className="text-teal-500" />}
          label="全部課程"
          count={countByCategory.all || 0}
          activeColor="#14b8a6"
        />
        {categories.map(c => (
          <CategoryTab key={c.id}
            active={activeCat === c.id}
            onClick={() => setActiveCat(c.id)}
            icon={<span className="text-2xl">{c.icon || "📚"}</span>}
            label={c.name}
            count={countByCategory[c.id] || 0}
            activeColor={c.color || "#14b8a6"}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryTab({ active, onClick, icon, label, count, activeColor }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-2xl border-2 transition-all min-w-[90px] ${
        active ? "bg-teal-50 shadow-sm" : "bg-white border-gray-100 hover:border-gray-200"
      }`}
      style={active ? { borderColor: activeColor } : {}}>
      <div className="flex items-center justify-center h-7">{icon}</div>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-semibold truncate max-w-[70px] ${active ? "text-gray-900" : "text-gray-600"}`}>{label}</span>
        <span className={`text-xs font-bold px-1.5 rounded-full ${active ? "text-white" : "bg-gray-100 text-gray-500"}`}
          style={active ? { backgroundColor: activeColor } : {}}>
          {count}
        </span>
      </div>
    </button>
  );
}