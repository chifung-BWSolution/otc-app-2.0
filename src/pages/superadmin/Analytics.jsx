import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

const attendanceData = [
  { month: "10月", rate: 95 },
  { month: "11月", rate: 93 },
  { month: "12月", rate: 88 },
  { month: "1月", rate: 91 },
  { month: "2月", rate: 94 },
  { month: "3月", rate: 97 },
];

const deptData = [
  { dept: "市場", headcount: 22, kpi: 85 },
  { dept: "銷售", headcount: 35, kpi: 91 },
  { dept: "IT", headcount: 18, kpi: 88 },
  { dept: "財務", headcount: 12, kpi: 79 },
  { dept: "人事", headcount: 8, kpi: 92 },
  { dept: "行政", headcount: 10, kpi: 83 },
];

const leaveTypeData = [
  { name: "年假", value: 145, color: "#60a5fa" },
  { name: "病假", value: 48, color: "#34d399" },
  { name: "事假", value: 23, color: "#fbbf24" },
  { name: "其他", value: 12, color: "#f472b6" },
];

const stats = [
  { label: "總員工人數", value: "105", icon: "👥", color: "bg-blue-50 text-blue-600" },
  { label: "本月出勤率", value: "97%", icon: "✅", color: "bg-green-50 text-green-600" },
  { label: "待審批申請", value: "8", icon: "📋", color: "bg-yellow-50 text-yellow-600" },
  { label: "本月新入職", value: "3", icon: "🎉", color: "bg-purple-50 text-purple-600" },
  { label: "進行中課程", value: "12", icon: "🎓", color: "bg-teal-50 text-teal-600" },
  { label: "本月費用報銷", value: "HK$45,280", icon: "💰", color: "bg-pink-50 text-pink-600" },
];

export default function Analytics() {
  return (
    <div className="space-y-4">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.color} border-current/10`}>
            <div className="text-2xl">{s.icon}</div>
            <div className="text-xl font-bold mt-1">{s.value}</div>
            <div className="text-xs opacity-70 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Attendance Trend */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3">📈 出勤率趨勢（近6個月）</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={attendanceData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: "#3b82f6" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Dept KPI */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3">🎯 各部門KPI評分</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={deptData}>
            <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
            <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="kpi" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leave Breakdown & Headcount */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-3">🌴 假期類型分佈</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={leaveTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {leaveTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-3">👥 各部門人數</h3>
          <div className="space-y-2">
            {deptData.map((d) => (
              <div key={d.dept} className="flex items-center gap-3">
                <div className="w-12 text-sm text-gray-600">{d.dept}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                  <div
                    className="h-5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(d.headcount / 35) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{d.headcount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}