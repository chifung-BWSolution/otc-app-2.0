import { useState } from "react";
import { Search, Phone, Mail, MessageCircle } from "lucide-react";
import { staffList } from "../../data/staffData";

const offices = ["全部", "CFA HK"];
const teams = ["全部", ...Array.from(new Set(staffList.map((s) => s.team)))];
const roles = ["全部", "Director", "Team Leader", "Assistant Team Leader", "Team Member"];

export default function ContactColleagues() {
  const [search, setSearch] = useState("");
  const [officeFilter, setOfficeFilter] = useState("全部");
  const [teamFilter, setTeamFilter] = useState("全部");
  const [roleFilter, setRoleFilter] = useState("全部");

  const filtered = staffList.filter((s) =>
    (officeFilter === "全部" || s.office === officeFilter) &&
    (teamFilter === "全部" || s.team === teamFilter) &&
    (roleFilter === "全部" || s.role === roleFilter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nameZh.includes(search) ||
      s.team.includes(search) ||
      s.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
            placeholder="搜尋姓名、團隊..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)}>
          {offices.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          {teams.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          {roles.map((r) => <option key={r}>{r}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">共 {filtered.length} 人</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold">
              <th className="px-3 py-3 text-left">辦公位置</th>
              <th className="px-3 py-3 text-left">狀態</th>
              <th className="px-3 py-3 text-left">職員名稱</th>
              <th className="px-3 py-3 text-left">團隊</th>
              <th className="px-3 py-3 text-left">Leader</th>
              <th className="px-3 py-3 text-left">BU</th>
              <th className="px-3 py-3 text-left">身份</th>
              <th className="px-3 py-3 text-left">工作手機</th>
              <th className="px-3 py-3 text-left">直線電話</th>
              <th className="px-3 py-3 text-left">Gmail</th>
              <th className="px-3 py-3 text-left">居住地區</th>
              <th className="px-3 py-3 text-left">動作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{s.office}</td>
                <td className="px-3 py-3">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{s.status}</span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 ${s.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>{s.avatar}</div>
                    <div>
                      <div className="font-semibold text-gray-900 text-xs">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.nameZh}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-blue-600 font-medium whitespace-nowrap">{s.team}</td>
                <td className="px-3 py-3 text-xs text-blue-500 whitespace-nowrap">{s.leader || "—"}</td>
                <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{s.bu}</td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${
                    s.role === "Director" ? "bg-red-100 text-red-700" :
                    s.role.includes("Leader") ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{s.role}</span>
                </td>
                <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">
                  {s.mobile ? <a href={`tel:${s.mobile}`} className="hover:text-blue-600 flex items-center gap-1"><Phone size={11} />{s.mobile}</a> : "—"}
                </td>
                <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{s.directLine || "—"}</td>
                <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">
                  {s.gmail !== "N/A" ? <a href={`mailto:${s.gmail}`} className="hover:text-blue-600 flex items-center gap-1"><Mail size={11} />{s.gmail}</a> : "N/A"}
                </td>
                <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{s.region}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    {s.mobile && (
                      <a href={`tel:${s.mobile}`} className="p-1.5 bg-blue-50 rounded-lg text-blue-500 hover:bg-blue-100 transition-colors"><Phone size={13} /></a>
                    )}
                    {s.gmail !== "N/A" && (
                      <a href={`mailto:${s.gmail}`} className="p-1.5 bg-green-50 rounded-lg text-green-500 hover:bg-green-100 transition-colors"><Mail size={13} /></a>
                    )}
                    {s.mobile && (
                      <a href={`https://wa.me/852${s.mobile}`} target="_blank" rel="noreferrer" className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500 hover:bg-emerald-100 transition-colors"><MessageCircle size={13} /></a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">沒有符合條件的員工</div>
        )}
      </div>
    </div>
  );
}