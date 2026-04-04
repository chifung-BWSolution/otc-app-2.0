import { useState } from "react";
import { Search, Phone, Mail, MessageCircle, X, Edit2, Check, Globe, MapPin, Users, Briefcase, Building2 } from "lucide-react";
import { staffList as initialStaff } from "../../data/staffData";
import { base44 } from "@/api/base44Client";
import { useEffect } from "react";

const offices = ["全部", "CFA HK"];
const teams = ["全部", ...Array.from(new Set(initialStaff.map((s) => s.team)))];
const roles = ["全部", "Director", "Team Leader", "Assistant Team Leader", "Team Member"];

const roleColors = {
  Director: "bg-red-100 text-red-700",
  "Team Leader": "bg-blue-100 text-blue-700",
  "Assistant Team Leader": "bg-indigo-100 text-indigo-700",
  "Team Member": "bg-gray-100 text-gray-600",
};

export default function ContactColleagues() {
  const [staff, setStaff] = useState(initialStaff);
  const [search, setSearch] = useState("");
  const [officeFilter, setOfficeFilter] = useState("全部");
  const [teamFilter, setTeamFilter] = useState("全部");
  const [roleFilter, setRoleFilter] = useState("全部");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const canEdit = (person) => isAdmin || currentUser?.email === person.gmail || currentUser?.email === person.workEmail;

  const filtered = staff.filter((s) =>
    (officeFilter === "全部" || s.office === officeFilter) &&
    (teamFilter === "全部" || s.team === teamFilter) &&
    (roleFilter === "全部" || s.role === roleFilter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nameZh.includes(search) ||
      s.team.includes(search))
  );

  const openProfile = (person) => {
    setSelected(person);
    setEditing(false);
  };

  const startEdit = () => {
    setEditForm({ ...selected });
    setEditing(true);
  };

  const saveEdit = () => {
    setStaff((prev) => prev.map((s) => (s.id === editForm.id ? { ...s, ...editForm } : s)));
    setSelected({ ...selected, ...editForm });
    setEditing(false);
  };

  const field = (label, value, icon) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-400 mb-0.5">{label}</div>
        <div className="text-sm text-gray-800 font-medium break-all">{value || "—"}</div>
      </div>
    </div>
  );

  const editField = (label, key, icon) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 mt-2 shrink-0">{icon}</span>
      <div className="flex-1">
        <div className="text-xs text-gray-400 mb-1">{label}</div>
        <input
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
          value={editForm[key] || ""}
          onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      </div>
    </div>
  );

  return (
    <div className="flex gap-4 h-full relative">
      {/* Main table */}
      <div className={`flex-1 space-y-3 transition-all ${selected ? "md:mr-0" : ""}`}>
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
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold bg-gray-50/80">
                <th className="px-4 py-3 text-left">職員</th>
                <th className="px-4 py-3 text-left">公司/BU</th>
                <th className="px-4 py-3 text-left">身份</th>
                <th className="px-4 py-3 text-left">狀態</th>
                <th className="px-4 py-3 text-left">Gmail</th>
                <th className="px-4 py-3 text-left">手機</th>
                <th className="px-4 py-3 text-left">居住地區</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => openProfile(s)}
                  className={`border-b border-gray-50 cursor-pointer transition-colors hover:bg-blue-50/40 ${selected?.id === s.id ? "bg-blue-50/60" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${s.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>{s.avatar}</div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.nameZh}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div className="font-medium">{s.office}</div>
                    <div className="text-gray-400">{s.bu}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${roleColors[s.role] || "bg-gray-100 text-gray-600"}`}>{s.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-40 truncate">{s.gmail !== "N/A" ? s.gmail : "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{s.mobile || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{s.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">沒有符合條件的員工</div>
          )}
        </div>
      </div>

      {/* Profile side panel */}
      {selected && (
        <div className="w-72 shrink-0 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden sticky top-0 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
          {/* Banner + avatar */}
          <div className="relative">
            <div className={`h-20 ${selected.color} bg-gradient-to-br opacity-30`} style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }} />
            <div className="absolute inset-0 h-20" style={{ background: "linear-gradient(135deg, #c7d2fe, #ddd6fe)" }} />
            <div className="absolute top-3 right-3 flex gap-1">
              {canEdit(selected) && !editing && (
                <button onClick={startEdit} className="p-1.5 bg-white/80 backdrop-blur rounded-lg text-gray-600 hover:bg-white transition-colors shadow-sm">
                  <Edit2 size={13} />
                </button>
              )}
              <button onClick={() => { setSelected(null); setEditing(false); }} className="p-1.5 bg-white/80 backdrop-blur rounded-lg text-gray-600 hover:bg-white transition-colors shadow-sm">
                <X size={13} />
              </button>
            </div>
            <div className={`absolute -bottom-5 left-4 w-12 h-12 ${selected.color} rounded-full flex items-center justify-center text-white text-lg font-bold ring-4 ring-white`}>
              {selected.avatar}
            </div>
          </div>

          <div className="pt-7 px-4 pb-2">
            <div className="font-black text-gray-900 text-base">{selected.name}</div>
            <div className="text-xs text-gray-500">{selected.nameZh} · <span className="text-blue-500">{selected.team}</span></div>
            {!editing && (
              <div className="flex gap-2 mt-3">
                {selected.mobile && (
                  <a href={`tel:${selected.mobile}`} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                    <Phone size={13} /> 致電
                  </a>
                )}
                {selected.gmail !== "N/A" && (
                  <a href={`mailto:${selected.gmail}`} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 hover:bg-green-100 hover:text-green-600 transition-colors">
                    <Mail size={13} /> 電郵
                  </a>
                )}
                {selected.mobile && (
                  <a href={`https://wa.me/852${selected.mobile}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 hover:bg-emerald-100 hover:text-emerald-600 transition-colors">
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="px-4 pb-4 mt-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">詳細資料</div>
            {editing ? (
              <div className="space-y-0">
                {editField("辦公室", "office", <Building2 size={14} />)}
                {editField("BU", "bu", <Briefcase size={14} />)}
                {editField("團隊", "team", <Users size={14} />)}
                {editField("身份", "role", <Briefcase size={14} />)}
                {editField("工作手機", "mobile", <Phone size={14} />)}
                {editField("直線電話", "directLine", <Phone size={14} />)}
                {editField("Gmail", "gmail", <Mail size={14} />)}
                {editField("工作電郵", "workEmail", <Mail size={14} />)}
                {editField("居住地區", "region", <MapPin size={14} />)}
                <div className="flex gap-2 mt-3">
                  <button onClick={saveEdit} className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                    <Check size={14} /> 儲存
                  </button>
                  <button onClick={() => setEditing(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {field("公司單位", selected.office, <Building2 size={14} />)}
                {field("BU", selected.bu, <Briefcase size={14} />)}
                {field("身份", selected.role, <Briefcase size={14} />)}
                {field("手機", selected.mobile, <Phone size={14} />)}
                {field("直線", selected.directLine, <Phone size={14} />)}
                {field("Gmail", selected.gmail !== "N/A" ? selected.gmail : null, <Mail size={14} />)}
                {field("工作電郵", selected.workEmail !== "N/A" ? selected.workEmail : null, <Mail size={14} />)}
                {field("居住地區", selected.region, <MapPin size={14} />)}
                {field("Leader", selected.leader, <Users size={14} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}