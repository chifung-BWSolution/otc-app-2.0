import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, DollarSign, RefreshCw, MessageSquare, Filter } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

const DEPT_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#8b5cf6"];
const CAT_COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#8b5cf6","#14b8a6","#f97316"];

const CATEGORIES = ["全部", "生產力工具", "溝通協作", "銷售CRM", "財務會計", "HR管理", "設計創意", "IT安全", "數據分析", "其他"];
const DEPTS = ["全部", "市場部", "銷售部", "IT部", "財務部", "人事部", "行政部", "全體"];

function StatCard({ label, value, sub, color = "blue", icon: Icon }) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    green: "bg-green-50 border-green-100 text-green-600",
    orange: "bg-orange-50 border-orange-100 text-orange-600",
    purple: "bg-purple-50 border-purple-100 text-purple-600",
  };
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={16} />}
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AppStoreAnalytics() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("全部");
  const [catFilter, setCatFilter] = useState("全部");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.CompanyApp.list("-created_date", 200),
      base44.entities.AppFeedback.list("-created_date", 500),
    ]).then(([a, f]) => {
      setApps(a);
      setFeedbacks(f);
      setLoading(false);
    });
  }, []);

  // Filter apps
  const filteredApps = apps.filter(a => {
    const matchDept = deptFilter === "全部" || (a.departments || []).includes(deptFilter) || (a.departments || []).includes("全體");
    const matchCat = catFilter === "全部" || a.category === catFilter;
    const matchDate = (!dateFrom || (a.created_date && a.created_date >= dateFrom)) &&
                      (!dateTo || (a.created_date && a.created_date <= dateTo + "T23:59:59"));
    return matchDept && matchCat && matchDate;
  });

  const filteredFeedbacks = feedbacks.filter(fb => {
    const matchDate = (!dateFrom || (fb.created_date && fb.created_date >= dateFrom)) &&
                      (!dateTo || (fb.created_date && fb.created_date <= dateTo + "T23:59:59"));
    return matchDate;
  });

  // ── KPIs ──────────────────────────────────────────────
  const activeApps = filteredApps.filter(a => a.status === "使用中");
  const totalMonthlyCost = activeApps.reduce((s, a) => s + (a.monthly_cost || 0), 0);
  const autoRenewCount = filteredApps.filter(a => a.auto_renew).length;
  const expiringIn30 = filteredApps.filter(a => {
    if (!a.expiry_date) return false;
    const d = Math.ceil((new Date(a.expiry_date) - new Date()) / 86400000);
    return d >= 0 && d <= 30;
  }).length;

  // ── Cost by Department ─────────────────────────────────
  const deptCostMap = {};
  activeApps.forEach(a => {
    const depts = a.departments?.length ? a.departments : ["未分配"];
    const costPerDept = (a.monthly_cost || 0) / depts.length;
    depts.forEach(d => {
      deptCostMap[d] = (deptCostMap[d] || 0) + costPerDept;
    });
  });
  const deptCostData = Object.entries(deptCostMap)
    .map(([dept, cost]) => ({ dept, cost: Math.round(cost) }))
    .sort((a, b) => b.cost - a.cost);

  // ── Apps by Category ──────────────────────────────────
  const catCountMap = {};
  filteredApps.forEach(a => {
    catCountMap[a.category || "其他"] = (catCountMap[a.category || "其他"] || 0) + 1;
  });
  const catData = Object.entries(catCountMap).map(([name, value]) => ({ name, value }));

  // ── Status Breakdown ─────────────────────────────────
  const statusMap = {};
  filteredApps.forEach(a => { statusMap[a.status || "未知"] = (statusMap[a.status || "未知"] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  const statusColors = { "使用中": "#10b981", "即將到期": "#f59e0b", "已暫停": "#94a3b8", "已取消": "#ef4444" };

  // ── Monthly Cost Trend (simulate from creation dates) ─
  const monthlyTrendMap = {};
  activeApps.forEach(a => {
    if (!a.created_date) return;
    const month = a.created_date.slice(0, 7);
    if (!monthlyTrendMap[month]) monthlyTrendMap[month] = 0;
    monthlyTrendMap[month] += a.monthly_cost || 0;
  });
  const trendData = Object.entries(monthlyTrendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, cost]) => ({ month: month.slice(5) + "月", cost: Math.round(cost) }));

  // ── Feedback Sentiment ────────────────────────────────
  const fbTypeMap = {};
  filteredFeedbacks.forEach(fb => { fbTypeMap[fb.type || "其他"] = (fbTypeMap[fb.type || "其他"] || 0) + 1; });
  const fbTypeData = Object.entries(fbTypeMap).map(([name, value]) => ({ name, value }));

  const fbStatusMap = {};
  filteredFeedbacks.forEach(fb => { fbStatusMap[fb.status || "待跟進"] = (fbStatusMap[fb.status || "待跟進"] || 0) + 1; });
  const resolvedRate = filteredFeedbacks.length > 0
    ? Math.round((filteredFeedbacks.filter(f => f.status === "已完成").length / filteredFeedbacks.length) * 100)
    : 0;

  // ── Top Apps by Cost ──────────────────────────────────
  const topApps = [...filteredApps]
    .filter(a => a.monthly_cost > 0)
    .sort((a, b) => b.monthly_cost - a.monthly_cost)
    .slice(0, 8);

  // ── Renewal Rate (auto vs manual) ────────────────────
  const renewalData = [
    { name: "自動續期", value: filteredApps.filter(a => a.auto_renew).length },
    { name: "手動續期", value: filteredApps.filter(a => !a.auto_renew).length },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mr-3" />
      載入分析數據中...
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/app/store")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">App Store 分析儀表板</h1>
            <p className="text-xs text-gray-500">訂閱成本、使用趨勢及用戶意見分析</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-gray-400" />
        <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-gray-50 focus:outline-none" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          {DEPTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-gray-50 focus:outline-none" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="flex items-center gap-1.5">
          <input type="date" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-gray-400 text-xs">至</span>
          <input type="date" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        {(deptFilter !== "全部" || catFilter !== "全部" || dateFrom || dateTo) && (
          <button onClick={() => { setDeptFilter("全部"); setCatFilter("全部"); setDateFrom(""); setDateTo(""); }} className="text-xs text-red-500 hover:text-red-700 ml-auto">清除篩選</button>
        )}
        <span className="text-xs text-gray-400 ml-auto">共 {filteredApps.length} 個 App</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="使用中 App" value={activeApps.length} sub={`共 ${filteredApps.length} 個`} color="blue" icon={TrendingUp} />
        <StatCard label="每月總費用" value={`HK$${totalMonthlyCost.toLocaleString()}`} sub={`年費 HK$${(totalMonthlyCost * 12).toLocaleString()}`} color="green" icon={DollarSign} />
        <StatCard label="自動續期" value={`${autoRenewCount} 個`} sub={`佔 ${filteredApps.length ? Math.round(autoRenewCount/filteredApps.length*100) : 0}%`} color="purple" icon={RefreshCw} />
        <StatCard label="30天內到期" value={`${expiringIn30} 個`} sub="需要跟進" color={expiringIn30 > 0 ? "orange" : "blue"} icon={MessageSquare} />
      </div>

      {/* Row 1: Cost by Dept + Category Pie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cost by Department */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">各部門每月訂閱費用 (HKD)</h3>
          {deptCostData.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">暫無費用數據</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptCostData} margin={{ top: 0, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dept" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={v => [`HK$${v}`, "費用"]} />
                <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {deptCostData.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">App 分類分佈</h3>
          {catData.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">暫無數據</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {catData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {catData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    <span className="text-gray-600 flex-1 truncate">{d.name}</span>
                    <span className="font-bold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Monthly Cost Trend + Renewal Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Trend */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:col-span-2">
          <h3 className="font-bold text-gray-800 text-sm mb-3">訂閱費用趨勢（按加入月份）</h3>
          {trendData.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">暫無趨勢數據</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={v => [`HK$${v}`, "月費"]} />
                <Line type="monotone" dataKey="cost" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: "#6366f1" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Renewal Types */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">續期方式</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={renewalData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, value }) => `${value}`}>
                <Cell fill="#6366f1" />
                <Cell fill="#94a3b8" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {renewalData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: i === 0 ? "#6366f1" : "#94a3b8" }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Top Apps by Cost + Status + Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Apps */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:col-span-2">
          <h3 className="font-bold text-gray-800 text-sm mb-3">最高費用 App 排行</h3>
          {topApps.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">暫無費用數據</p>
          ) : (
            <div className="space-y-2">
              {topApps.map((app, i) => {
                const maxCost = topApps[0].monthly_cost;
                return (
                  <div key={app.id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                    <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }}>
                      {app.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-gray-800 truncate">{app.name}</span>
                        <span className="text-xs font-bold text-green-600 shrink-0 ml-2">HK${app.monthly_cost}/月</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5 w-full">
                        <div className="h-1.5 rounded-full" style={{ width: `${(app.monthly_cost / maxCost) * 100}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Feedback Analysis */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-800 text-sm mb-3">意見分析</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-gray-800">{filteredFeedbacks.length}</div>
              <div className="text-xs text-gray-500">總意見數</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
              <div className="text-xl font-bold text-green-600">{resolvedRate}%</div>
              <div className="text-xs text-gray-500">已解決率</div>
            </div>
            <div className="space-y-1.5">
              {fbTypeData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{d.name}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="bg-gray-100 rounded-full h-1.5 w-16">
                      <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${filteredFeedbacks.length ? (d.value / filteredFeedbacks.length) * 100 : 0}%` }} />
                    </div>
                    <span className="font-bold text-gray-700 w-4 text-right">{d.value}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Status breakdown */}
            <div className="pt-2 border-t border-gray-100 space-y-1">
              {Object.entries(fbStatusMap).map(([status, count]) => {
                const colors = { "待跟進": "text-orange-500", "處理中": "text-blue-500", "已完成": "text-green-600" };
                return (
                  <div key={status} className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${colors[status] || "text-gray-500"}`}>{status}</span>
                    <span className="font-bold text-gray-700">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}