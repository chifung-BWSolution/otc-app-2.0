import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Clock, ChevronRight, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";

const diffColor = ["", "bg-green-100 text-green-700", "bg-lime-100 text-lime-700", "bg-yellow-100 text-yellow-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"];

export default function CourseList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [activeUnit, setActiveUnit] = useState("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [courseData, catData] = await Promise.all([
      base44.entities.Course.filter({ status: "已發佈" }, "-created_date", 200),
      base44.entities.CourseCategory.filter({ is_active: true }, "sort_order", 100),
    ]);
    setCourses(courseData);
    setCategories(catData);
    setLoading(false);
  };

  const selectedCat = categories.find(c => c.id === activeCat);
  const availableUnits = selectedCat?.service_units || [];

  const filtered = courses.filter(c => {
    const matchSearch = !search || c.title?.includes(search) || c.description?.includes(search);
    const matchCat = activeCat === "all" || c.category_id === activeCat;
    const matchUnit = activeUnit === "all" || c.service_units?.includes(activeUnit);
    return matchSearch && matchCat && matchUnit;
  });

  if (loading) return <div className="text-center py-16 text-gray-400">載入中...</div>;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-3 text-gray-400" />
        <input className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
          placeholder="搜尋課程..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => { setActiveCat("all"); setActiveUnit("all"); }}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activeCat === "all" ? "bg-teal-600 text-white" : "bg-white text-gray-600 border border-gray-200"
          }`}>
          全部分類
        </button>
        {categories.map(c => (
          <button key={c.id} onClick={() => { setActiveCat(c.id); setActiveUnit("all"); }}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeCat === c.id ? "text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
            style={activeCat === c.id ? { backgroundColor: c.color || "#14b8a6" } : {}}>
            <span>{c.icon}</span> {c.name}
          </button>
        ))}
      </div>

      {/* Service Unit filter (only when a category is selected) */}
      {availableUnits.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveUnit("all")}
            className={`shrink-0 px-2.5 py-1 rounded-md text-xs transition-colors ${
              activeUnit === "all" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"
            }`}>
            全部服務單位
          </button>
          {availableUnits.map(u => (
            <button key={u} onClick={() => setActiveUnit(u)}
              className={`shrink-0 px-2.5 py-1 rounded-md text-xs transition-colors ${
                activeUnit === u ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"
              }`}>
              {u}
            </button>
          ))}
        </div>
      )}

      {/* Course cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
          <p>暫無課程</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => {
            const cat = categories.find(x => x.id === c.category_id);
            return (
              <button key={c.id} onClick={() => navigate(`/course/${c.id}`)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md hover:border-teal-200 transition-all group">
                {c.cover_image && (
                  <img src={c.cover_image} alt={c.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat?.icon || "📚"}</span>
                    <span className="text-xs text-gray-500">{cat?.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
                </div>
                <h4 className="font-bold text-gray-900 leading-tight mb-1">{c.title}</h4>
                {c.code && <div className="text-xs text-gray-400 mb-2">{c.code}</div>}
                {c.description && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{c.description}</p>}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor[c.difficulty] || "bg-gray-100"}`}>
                    <Star size={10} className="inline mr-0.5" /> Level {c.difficulty}
                  </span>
                  {c.duration_hours && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Clock size={10} /> {c.duration_hours}h
                    </span>
                  )}
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{c.learning_method}</span>
                </div>
                {c.service_units?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.service_units.slice(0, 3).map((u, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{u}</span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}