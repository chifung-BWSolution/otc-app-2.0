import { useState } from "react";
import { Search, Phone, Mail, MessageCircle, Plus, Edit2 } from "lucide-react";
import { staffList } from "../../data/staffData";

const offices = ["全部", "CFA HK"];
const teams = ["全部", ...Array.from(new Set(staffList.map((s) => s.team)))];
const roles = ["全部", "Director", "Team Leader", "Assistant Team Leader", "Team Member"];
const statuses = ["全部", "Active", "Inactive"];

export default function Directory() {
  const [search, setSearch] = useState("");
  const [officeFilter, setOfficeFilter] = useState("全部");
  const [teamFilter, setTeamFilter] = useState("全部");
  const [roleFilter, setRoleFilter] = useState("全部");
  const [tab, setTab] = useState("職員外表");

  const filtered = staffList.filter((s) =>
    (officeFilter === "全部" || s.office === officeFilter) &&
    (teamFilter === "全部" || s.team === teamFilter) &&
    (roleFilter === "全部" || s.role === roleFilter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nameZh.includes(search) ||
      s.team.includes(search))
  );

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-2">
        {["職員外表", "技能&問題"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === t ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{staffList.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">職員 {staffList.length}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-600">{staffList.filter(s => s.status === "正式員工").length}</div>
          <div className="text-xs text-gray-500 mt-0.5">正式員工</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
          <div className="text-2xl font-bold text-purple-600">{Array.from(new Set(staffList.map(s => s.team))).length}</div>
          <div className="text-xs text-gray-500 mt-0.5">團隊數量</div>
        </div>
      </div>

      {tab === "職員外表" && (
        <>
          {/* Filters + Actions */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-wrap gap-2 items-center">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none">
              {statuses.map((o) => <option key={o}>{o}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)}>
              {offices.map((o) => <option key={o}>{o === "全部" ? "公司單位" : o}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
              {teams.map((t) => <option key={t}>{t === "全部" ? "辦公位置" : t}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
              <option>工作年資</option>
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
              <option>電話分類</option>
            </select>
            <div className="relative flex-1 min-w-32">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
                placeholder="搜尋..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <button className="flex items-center gap-1.5 bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors">
                ✉ 發送 Offer
              </button>
              <button className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                <Plus size={13} /> 建立職員
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 px-1">職員: {filtered.length}</div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold bg-gray-50">
                  <th className="px-3 py-3 text-left">辦公位置</th>
                  <th className="px-3 py-3 text-left">狀態</th>
                  <th className="px-3 py-3 text-left">年資</th>
                  <th className="px-3 py-3 text-left">職員名稱</th>
                  <th className="px-3 py-3 text-left">團隊</th>
                  <th className="px-3 py-3 text-left">Leader</th>
                  <th className="px-3 py-3 text-left">BU</th>
                  <th className="px-3 py-3 text-left">身份</th>
                  <th className="px-3 py-3 text-left">工作手機</th>
                  <th className="px-3 py-3 text-left">直線電話</th>
                  <th className="px-3 py-3 text-left">Gmail</th>
                  <th className="px-3 py-3 text-left">工作電郵</th>
                  <th className="px-3 py-3 text-left">居住地區</th>
                  <th className="px-3 py-3 text-left">Whatsapp</th>
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
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{s.seniority}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 ${s.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>{s.avatar}</div>
                        <div>
                          <div className="font-semibold text-gray-900 text-xs whitespace-nowrap">{s.name}</div>
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
                      {s.mobile ? <a href={`tel:${s.mobile}`} className="hover:text-blue-600 flex items-center gap-1"><Phone size={11} className="shrink-0" />{s.mobile}</a> : "—"}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap max-w-32 truncate">{s.directLine || "—"}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 max-w-40 truncate">
                      {s.gmail !== "N/A" ? <a href={`mailto:${s.gmail}`} className="hover:text-blue-600 flex items-center gap-1 truncate"><Mail size={11} className="shrink-0" />{s.gmail}</a> : "N/A"}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 max-w-36 truncate">
                      {s.workEmail !== "N/A" ? <a href={`mailto:${s.workEmail}`} className="hover:text-blue-600 truncate">{s.workEmail}</a> : "N/A"}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{s.region}</td>
                    <td className="px-3 py-3">
                      {s.mobile && (
                        <a href={`https://wa.me/852${s.mobile}`} target="_blank" rel="noreferrer" className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500 hover:bg-emerald-100 transition-colors inline-flex">
                          <MessageCircle size={13} />
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button className="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">沒有符合條件的員工</div>
            )}
          </div>
        </>
      )}

      {tab === "技能&問題" && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center text-gray-400">
          <div className="text-4xl mb-2">🛠️</div>
          <p>技能&問題功能開發中</p>
        </div>
      )}
    </div>
  );
}