import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, ExternalLink, FileText, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TenderFormModal from "../../components/tender/TenderFormModal";

const statusColor = {
  "登記申請中": "bg-blue-100 text-blue-700",
  "登記成功": "bg-green-100 text-green-700",
  "登記失敗": "bg-red-100 text-red-700",
  "已取消登記": "bg-gray-100 text-gray-600",
};

const buColor = {
  ASX: "bg-purple-100 text-purple-700",
  BWA: "bg-blue-100 text-blue-700",
  BWD: "bg-indigo-100 text-indigo-700",
  BWE: "bg-teal-100 text-teal-700",
  BWL: "bg-green-100 text-green-700",
  BWT: "bg-orange-100 text-orange-700",
  FC: "bg-pink-100 text-pink-700",
  Wine: "bg-rose-100 text-rose-700",
  "志豐設計(深圳)": "bg-amber-100 text-amber-700",
};

export default function TenderRegistration() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buFilter, setBuFilter] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [me, data] = await Promise.all([
      base44.auth.me(),
      base44.entities.TenderRegistration.list("-created_date", 200),
    ]);
    setCurrentUser(me);
    setItems(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此登記記錄？")) return;
    await base44.entities.TenderRegistration.delete(id);
    load();
  };

  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const stats = {
    total: items.length,
    applying: items.filter(i => i.status === "登記申請中").length,
    success: items.filter(i => i.status === "登記成功").length,
    expiringSoon: items.filter(i => i.status === "登記成功" && i.expiry_date && i.expiry_date <= in30Days && i.expiry_date >= today).length,
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.organization?.includes(search) || i.account_email?.includes(search) || i.remarks?.includes(search);
    const matchStatus = !statusFilter || i.status === statusFilter;
    const matchBu = !buFilter || i.bu === buFilter;
    return matchSearch && matchStatus && matchBu;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-black text-gray-900">Tender 登記管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">管理公司招標登記資料</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
          <Plus size={16} /> 新增登記
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="總登記數" value={stats.total} color="blue" />
        <StatCard icon={Calendar} label="申請中" value={stats.applying} color="amber" />
        <StatCard icon={CheckCircle} label="登記成功" value={stats.success} color="green" />
        <StatCard icon={AlertTriangle} label="30日內到期" value={stats.expiringSoon} color="red" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
            placeholder="搜尋機構、電郵、備註..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={buFilter} onChange={e => setBuFilter(e.target.value)}>
          <option value="">全部 BU</option>
          {Object.keys(buColor).map(b => <option key={b}>{b}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">全部狀態</option>
          {Object.keys(statusColor).map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
          <FileText size={40} className="mx-auto mb-2 opacity-30" />
          <p>暫無登記記錄</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto shadow-sm">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">BU</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">登記機構</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">登記方式</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">申請日期</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">到期日</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">狀態</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">動作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const expiringSoon = i.status === "登記成功" && i.expiry_date && i.expiry_date <= in30Days && i.expiry_date >= today;
                return (
                  <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${buColor[i.bu] || "bg-gray-100 text-gray-600"}`}>{i.bu}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{i.organization || "—"}</div>
                      {i.account_email && <div className="text-xs text-gray-400">{i.account_email}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{i.registration_method}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{i.apply_date}</td>
                    <td className="px-4 py-3 text-xs">
                      {i.expiry_date ? (
                        <div className={expiringSoon ? "text-red-600 font-bold" : "text-gray-600"}>
                          {i.expiry_date}
                          {expiringSoon && <AlertTriangle size={11} className="inline ml-1" />}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[i.status] || "bg-gray-100"}`}>{i.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {i.asana_link && (
                          <a href={i.asana_link} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-purple-50 rounded text-purple-500" title="Asana">
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <button onClick={() => { setEditItem(i); setShowForm(true); }}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-500"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(i.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <TenderFormModal item={editItem} currentUser={currentUser}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <div className={`rounded-xl p-4 border ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 mb-1">{label}</div>
          <div className="text-2xl font-black">{value}</div>
        </div>
        <Icon size={22} className="opacity-60" />
      </div>
    </div>
  );
}