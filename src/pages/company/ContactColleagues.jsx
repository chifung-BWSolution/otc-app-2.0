import { useState } from "react";
import { Search, Phone, Mail, MessageCircle } from "lucide-react";

const colleagues = [
  { name: "陳大文", dept: "市場部", role: "市場總監", phone: "9123 4567", email: "chan@company.com", ext: "201", avatar: "陳", color: "bg-blue-400" },
  { name: "李小明", dept: "銷售部", role: "銷售代表", phone: "9234 5678", email: "lee@company.com", ext: "305", avatar: "李", color: "bg-green-400" },
  { name: "張美麗", dept: "IT部", role: "系統工程師", phone: "9345 6789", email: "cheung@company.com", ext: "402", avatar: "張", color: "bg-purple-400" },
  { name: "王志偉", dept: "財務部", role: "財務主任", phone: "9456 7890", email: "wong@company.com", ext: "501", avatar: "王", color: "bg-orange-400" },
  { name: "林曉琳", dept: "人事部", role: "HR主任", phone: "9567 8901", email: "lam@company.com", ext: "601", avatar: "林", color: "bg-pink-400" },
  { name: "黃俊傑", dept: "市場部", role: "設計師", phone: "9678 9012", email: "wong2@company.com", ext: "205", avatar: "黃", color: "bg-teal-400" },
];

const depts = ["全部", "市場部", "銷售部", "IT部", "財務部", "人事部"];

export default function ContactColleagues() {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("全部");

  const filtered = colleagues.filter(
    (c) =>
      (selectedDept === "全部" || c.dept === selectedDept) &&
      (c.name.includes(search) || c.role.includes(search))
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="搜尋同事姓名或職位..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {depts.map((d) => (
          <button key={d} onClick={() => setSelectedDept(d)} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedDept === d ? "bg-blue-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            {d}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((c) => (
          <div key={c.name} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${c.color} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>{c.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800">{c.name}</div>
              <div className="text-xs text-gray-500">{c.role} · {c.dept}</div>
              <div className="text-xs text-gray-400 mt-0.5">分機：{c.ext}</div>
            </div>
            <div className="flex gap-1">
              <a href={`tel:${c.phone}`} className="p-2 bg-blue-50 rounded-xl text-blue-500 hover:bg-blue-100 transition-colors"><Phone size={16} /></a>
              <a href={`mailto:${c.email}`} className="p-2 bg-green-50 rounded-xl text-green-500 hover:bg-green-100 transition-colors"><Mail size={16} /></a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}