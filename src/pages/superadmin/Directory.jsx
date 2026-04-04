import { useState } from "react";
import { Search, Phone, Mail } from "lucide-react";

const staff = [
  { id: 1, name: "陳大文", dept: "市場部", role: "市場總監", email: "chan@company.com", phone: "9123 4567", status: "在職", avatar: "陳" },
  { id: 2, name: "李小明", dept: "銷售部", role: "銷售代表", email: "lee@company.com", phone: "9234 5678", status: "在職", avatar: "李" },
  { id: 3, name: "張美麗", dept: "IT部", role: "系統工程師", email: "cheung@company.com", phone: "9345 6789", status: "在職", avatar: "張" },
  { id: 4, name: "王志偉", dept: "財務部", role: "財務主任", email: "wong@company.com", phone: "9456 7890", status: "在職", avatar: "王" },
  { id: 5, name: "林曉琳", dept: "人事部", role: "HR主任", email: "lam@company.com", phone: "9567 8901", status: "在職", avatar: "林" },
  { id: 6, name: "黃俊傑", dept: "市場部", role: "設計師", email: "wong2@company.com", phone: "9678 9012", status: "在職", avatar: "黃" },
  { id: 7, name: "劉偉明", dept: "銷售部", role: "銷售主任", email: "lau@company.com", phone: "9789 0123", status: "假期中", avatar: "劉" },
  { id: 8, name: "趙小燕", dept: "行政部", role: "行政助理", email: "chiu@company.com", phone: "9890 1234", status: "在職", avatar: "趙" },
];

const depts = ["全部", "市場部", "銷售部", "IT部", "財務部", "人事部", "行政部"];
const colors = ["bg-blue-400", "bg-green-400", "bg-purple-400", "bg-orange-400", "bg-pink-400", "bg-teal-400", "bg-yellow-400", "bg-red-400"];

export default function Directory() {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("全部");
  const [view, setView] = useState("grid");

  const filtered = staff.filter(
    (s) =>
      (selectedDept === "全部" || s.dept === selectedDept) &&
      (s.name.includes(search) || s.role.includes(search) || s.dept.includes(search))
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{staff.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">總員工數</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-600">{staff.filter(s => s.status === "在職").length}</div>
          <div className="text-xs text-gray-500 mt-0.5">在職</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
          <div className="text-2xl font-bold text-yellow-600">{staff.filter(s => s.status === "假期中").length}</div>
          <div className="text-xs text-gray-500 mt-0.5">假期中</div>
        </div>
      </div>

      {/* Search & View Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="搜尋同事姓名、職位..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
          <button onClick={() => setView("grid")} className={`px-3 py-1 rounded text-sm ${view === "grid" ? "bg-white shadow" : "text-gray-500"}`}>⊞</button>
          <button onClick={() => setView("list")} className={`px-3 py-1 rounded text-sm ${view === "list" ? "bg-white shadow" : "text-gray-500"}`}>☰</button>
        </div>
      </div>

      {/* Dept Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {depts.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDept(d)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedDept === d ? "bg-indigo-500 text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Staff Grid */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((s, i) => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 ${colors[i % colors.length]} rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto`}>
                {s.avatar}
              </div>
              <div className="font-semibold text-gray-800 mt-2 text-sm">{s.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.role}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${s.status === "在職" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                {s.status}
              </span>
              <div className="text-xs text-indigo-500 mt-1">{s.dept}</div>
              <div className="flex justify-center gap-2 mt-2">
                <a href={`tel:${s.phone}`} className="p-1.5 bg-blue-50 rounded-lg text-blue-500 hover:bg-blue-100 transition-colors">
                  <Phone size={14} />
                </a>
                <a href={`mailto:${s.email}`} className="p-1.5 bg-green-50 rounded-lg text-green-500 hover:bg-green-100 transition-colors">
                  <Mail size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filtered.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 border-gray-50 hover:bg-gray-50 transition-colors">
              <div className={`w-10 h-10 ${colors[i % colors.length]} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {s.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800">{s.name}</div>
                <div className="text-xs text-gray-500">{s.role} · {s.dept}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "在職" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                {s.status}
              </span>
              <div className="flex gap-1">
                <a href={`tel:${s.phone}`} className="p-1.5 bg-blue-50 rounded-lg text-blue-500 hover:bg-blue-100">
                  <Phone size={14} />
                </a>
                <a href={`mailto:${s.email}`} className="p-1.5 bg-green-50 rounded-lg text-green-500 hover:bg-green-100">
                  <Mail size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}