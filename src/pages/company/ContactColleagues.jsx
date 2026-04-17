import { useState, useEffect, useMemo } from "react";
import { Search, Phone, Mail, MessageCircle, X, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRegion } from "@/lib/RegionContext";
import ContactProfilePanel from "@/components/contact/ContactProfilePanel";

function normalizePhone(raw) {
  if (!raw) return "";
  return String(raw).replace(/[^\d+]/g, "");
}

function whatsAppURL(mobile) {
  const clean = normalizePhone(mobile);
  if (!clean) return null;
  if (clean.startsWith("+")) return `https://wa.me/${clean.slice(1)}`;
  if (clean.startsWith("00")) return `https://wa.me/${clean.slice(2)}`;
  if (clean.length === 11 && clean.startsWith("1")) return `https://wa.me/86${clean}`;
  if (clean.length === 8) return `https://wa.me/852${clean}`;
  return `https://wa.me/${clean}`;
}

export default function ContactColleagues() {
  const { regions, getRegionByLocation } = useRegion();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [buFilter, setBuFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 1000);
    setStaff(data);
    setLoading(false);
  };

  // Derive filter options from data
  const bus = useMemo(() => [...new Set(staff.map(s => s.bu_name).filter(Boolean))].sort(), [staff]);
  const teams = useMemo(() => {
    const list = staff.filter(s => buFilter === "all" || s.bu_name === buFilter);
    return [...new Set(list.map(s => s.team_name).filter(Boolean))].sort();
  }, [staff, buFilter]);
  const roles = useMemo(() => [...new Set(staff.map(s => s.team_role_name).filter(Boolean))].sort(), [staff]);

  const filtered = useMemo(() => {
    return staff.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        (s.display_name || "").toLowerCase().includes(q) ||
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.chinese_name || "").includes(search) ||
        (s.position || "").toLowerCase().includes(q) ||
        (s.team_name || "").toLowerCase().includes(q) ||
        (s.work_email || "").toLowerCase().includes(q);
      const region = getRegionByLocation(s.base_location);
      const matchRegion = regionFilter === "all" || region?.code === regionFilter;
      const matchBu = buFilter === "all" || s.bu_name === buFilter;
      const matchTeam = teamFilter === "all" || s.team_name === teamFilter;
      const matchRole = roleFilter === "all" || s.team_role_name === roleFilter;
      return matchSearch && matchRegion && matchBu && matchTeam && matchRole;
    });
  }, [staff, search, regionFilter, buFilter, teamFilter, roleFilter, getRegionByLocation]);

  const hasFilter = search || regionFilter !== "all" || buFilter !== "all" || teamFilter !== "all" || roleFilter !== "all";
  const clearFilters = () => {
    setSearch(""); setRegionFilter("all"); setBuFilter("all"); setTeamFilter("all"); setRoleFilter("all");
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Main list */}
      <div className="flex-1 space-y-3 min-w-0">
        {/* Header + Region tabs */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Users size={16} className="text-gray-500" />
            <h2 className="font-black text-gray-900">全公司員工通訊錄</h2>
            <span className="text-xs text-gray-400 ml-auto">共 {filtered.length} / {staff.length} 人</span>
          </div>

          {/* Region quick tabs */}
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setRegionFilter("all")}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                regionFilter === "all" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              🌏 全部地區 ({staff.length})
            </button>
            {regions.map(r => {
              const count = staff.filter(s => getRegionByLocation(s.base_location)?.code === r.code).length;
              const active = regionFilter === r.code;
              return (
                <button key={r.code} onClick={() => setRegionFilter(r.code)}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                    active ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={active ? { backgroundColor: r.color || "#14b8a6" } : {}}>
                  {r.icon} {r.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Search + function filters */}
          <div className="flex flex-wrap gap-2 items-center pt-1">
            <div className="relative flex-1 min-w-40">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
                placeholder="搜尋姓名、職位、電郵..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={buFilter} onChange={e => { setBuFilter(e.target.value); setTeamFilter("all"); }}>
              <option value="all">全部 BU</option>
              {bus.map(b => <option key={b}>{b}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
              <option value="all">全部 Team</option>
              {teams.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="all">全部職能</option>
              {roles.map(r => <option key={r}>{r}</option>)}
            </select>
            {hasFilter && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2">
                <X size={11} /> 清除
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">載入中...</div>
          ) : (
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold bg-gray-50/80">
                  <th className="px-4 py-3 text-left">員工</th>
                  <th className="px-4 py-3 text-left">地區</th>
                  <th className="px-4 py-3 text-left">BU / Team</th>
                  <th className="px-4 py-3 text-left">職位</th>
                  <th className="px-4 py-3 text-left">工作電郵</th>
                  <th className="px-4 py-3 text-center">快捷聯絡</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const region = getRegionByLocation(s.base_location);
                  const wa = whatsAppURL(s.mobile);
                  return (
                    <tr key={s.id}
                      onClick={() => setSelected(s)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors hover:bg-blue-50/40 ${selected?.id === s.id ? "bg-blue-50/60" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.profile_pic ? (
                            <img src={s.profile_pic} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: region?.color || "#6366f1" }}>
                              {(s.display_name || "?")[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{s.display_name}</div>
                            <div className="text-xs text-gray-400">{s.full_name || s.chinese_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {region ? (
                          <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium whitespace-nowrap"
                            style={{ backgroundColor: region.color || "#14b8a6" }}>
                            {region.icon} {region.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">{s.base_location || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="text-blue-600 font-medium">{s.team_name || "—"}</div>
                        <div className="text-gray-400">{s.bu_name || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{s.position || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-48 truncate">{s.work_email || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                          {s.work_email && (
                            <a href={`mailto:${s.work_email}`} title="發送電郵"
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                              <Mail size={12} />
                            </a>
                          )}
                          {(s.direct_phone || s.mobile) && (
                            <a href={`tel:${normalizePhone(s.direct_phone || s.mobile)}`} title="致電"
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                              <Phone size={12} />
                            </a>
                          )}
                          {wa && (
                            <a href={wa} target="_blank" rel="noreferrer" title="WhatsApp"
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                              <MessageCircle size={12} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              沒有符合條件的員工
            </div>
          )}
        </div>
      </div>

      {/* Profile side panel */}
      {selected && (
        <ContactProfilePanel
          person={selected}
          region={getRegionByLocation(selected.base_location)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}