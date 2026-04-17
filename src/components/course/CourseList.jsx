import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Clock, Star, X, LayoutGrid, List, ChevronRight } from "lucide-react";
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
  const [viewMode, setViewMode] = useState("table"); // table | grid
  const [sortBy, setSortBy] = useState("title"); // title | difficulty | duration

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

  // Course counts per category for sidebar
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
    // Sort
    list.sort((a, b) => {
      if (sortBy === "difficulty") return (a.difficulty || 0) - (b.difficulty || 0);
      if (sortBy === "duration") return (a.duration_hours || 0) - (b.duration_hours || 0);
      return (a.title || "").localeCompare(b.title || "");
    });
    return list;
  }, [courses, search, activeCat, activeUnit, difficulty, method, sortBy]);

  const hasFilter = search || activeCat !== "all" || activeUnit !== "all" || difficulty !== "all" || method !== "all";
  const clearFilters = () => {
    setSearch(""); setActiveCat("all"); setActiveUnit("all"); setDifficulty("all"); setMethod("all");
  };

  if (loading) return <div className="text-center py-16 text-gray-400">載入中...</div>;

  return (
    <div className="flex gap-3 min-h-[500px]">
      {/* Sidebar - Category Tree */}
      <aside className="w-48 shrink-0 hidden md:block">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-20">
          <div className="px-3 py-2 border-b bg-gray-50 text-xs font-bold text-gray-600">課程分類</div>
          <div className="max-h-[70vh] overflow-y-auto">
            <button onClick={() => { setActiveCat("all"); setActiveUnit("all"); }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between border-b border-gray-50 transition-colors ${
                activeCat === "all" ? "bg-teal-50 text-teal-700 font-bold" : "hover:bg-gray-50 text-gray-600"
              }`}>
              <span>📚 全部課程</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 rounded-full">{countByCategory.all || 0}</span>
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => { setActiveCat(c.id); setActiveUnit("all"); }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between border-b border-gray-50 transition-colors ${
                  activeCat === c.id ? "text-white font-bold" : "hover:bg-gray-50 text-gray-600"
                }`}
                style={activeCat === c.id ? { backgroundColor: c.color || "#14b8a6" } : {}}>
                <span className="flex items-center gap-1.5 min-w-0">
                  <span>{c.icon || "📚"}</span>
                  <span className="truncate">{c.name}</span>
                </span>
                <span className={`text-xs px-1.5 rounded-full shrink-0 ${activeCat === c.id ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
                  {countByCategory[c.id] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Mobile category pills */}
        <div className="md:hidden flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={() => { setActiveCat("all"); setActiveUnit("all"); }}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${activeCat === "all" ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
            全部 ({countByCategory.all || 0})
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => { setActiveCat(c.id); setActiveUnit("all"); }}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${activeCat === c.id ? "text-white" : "bg-white border border-gray-200 text-gray-600"}`}
              style={activeCat === c.id ? { backgroundColor: c.color || "#14b8a6" } : {}}>
              {c.icon} {c.name} ({countByCategory[c.id] || 0})
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-40">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-300"
              placeholder="搜尋課程名稱、編號、描述..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <select className="border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="all">全部難度</option>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Level {n}</option>)}
          </select>

          <select className="border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white" value={method} onChange={e => setMethod(e.target.value)}>
            <option value="all">全部方式</option>
            {METHOD_OPTIONS.map(m => <option key={m}>{m}</option>)}
          </select>

          <select className="border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="title">按名稱</option>
            <option value="difficulty">按難度</option>
            <option value="duration">按時數</option>
          </select>

          {hasFilter && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-1">
              <X size={11} /> 清除
            </button>
          )}

          <div className="ml-auto flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("table")}
              className={`p-1.5 ${viewMode === "table" ? "bg-teal-500 text-white" : "bg-white text-gray-400"}`} title="Table">
              <List size={14} />
            </button>
            <button onClick={() => setViewMode("grid")}
              className={`p-1.5 ${viewMode === "grid" ? "bg-teal-500 text-white" : "bg-white text-gray-400"}`} title="Grid">
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>

        {/* Service Unit filter */}
        {availableUnits.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button onClick={() => setActiveUnit("all")}
              className={`shrink-0 px-2.5 py-1 rounded-md text-xs transition-colors ${activeUnit === "all" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}`}>
              全部服務單位
            </button>
            {availableUnits.map(u => (
              <button key={u} onClick={() => setActiveUnit(u)}
                className={`shrink-0 px-2.5 py-1 rounded-md text-xs transition-colors ${activeUnit === u ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}`}>
                {u}
              </button>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500">共 <span className="font-bold text-gray-800">{filtered.length}</span> 個課程</div>

        {/* Empty */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
            <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
            <p>暫無符合條件的課程</p>
          </div>
        ) : viewMode === "table" ? (
          /* TABLE VIEW */
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-600">
                  <th className="px-4 py-2.5 text-left font-bold">課程名稱</th>
                  <th className="px-4 py-2.5 text-left font-bold">分類</th>
                  <th className="px-4 py-2.5 text-left font-bold">服務單位</th>
                  <th className="px-4 py-2.5 text-center font-bold">難度</th>
                  <th className="px-4 py-2.5 text-center font-bold">時數</th>
                  <th className="px-4 py-2.5 text-center font-bold">方式</th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const cat = categories.find(x => x.id === c.category_id);
                  return (
                    <tr key={c.id} onClick={() => navigate(`/course/${c.id}`)}
                      className="border-b border-gray-50 hover:bg-teal-50/40 cursor-pointer transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-gray-900">{c.title}</div>
                        {c.code && <div className="text-xs text-gray-400">{c.code}</div>}
                      </td>
                      <td className="px-4 py-2.5">
                        {cat && (
                          <span className="text-xs inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            <span>{cat.icon}</span> {cat.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(c.service_units || []).slice(0, 2).map((u, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{u}</span>
                          ))}
                          {(c.service_units || []).length > 2 && (
                            <span className="text-xs text-gray-400">+{c.service_units.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor[c.difficulty] || "bg-gray-100"}`}>
                          <Star size={9} className="inline mr-0.5" />L{c.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-600">
                        {c.duration_hours ? (
                          <span className="inline-flex items-center gap-0.5"><Clock size={10} />{c.duration_hours}h</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{c.learning_method}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <ChevronRight size={14} className="text-gray-300 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(c => {
              const cat = categories.find(x => x.id === c.category_id);
              return (
                <button key={c.id} onClick={() => navigate(`/course/${c.id}`)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:border-teal-200 transition-all">
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
    </div>
  );
}