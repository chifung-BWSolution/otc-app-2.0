import { useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const kpiData = [
  { subject: "銷售目標", A: 85, fullMark: 100 },
  { subject: "客戶滿意", A: 92, fullMark: 100 },
  { subject: "項目完成", A: 78, fullMark: 100 },
  { subject: "培訓時數", A: 65, fullMark: 100 },
  { subject: "出勤率", A: 96, fullMark: 100 },
  { subject: "團隊協作", A: 88, fullMark: 100 },
];

const monthlyData = [
  { month: "10月", score: 78 },
  { month: "11月", score: 82 },
  { month: "12月", score: 75 },
  { month: "1月", score: 85 },
  { month: "2月", score: 88 },
  { month: "3月", score: 92 },
];

const kpiItems = [
  { label: "銷售目標達成率", target: "100%", actual: "85%", score: 85, color: "text-blue-500" },
  { label: "客戶滿意度", target: "90分", actual: "92分", score: 92, color: "text-green-500" },
  { label: "項目完成率", target: "100%", actual: "78%", score: 78, color: "text-orange-500" },
  { label: "培訓時數", target: "20小時", actual: "13小時", score: 65, color: "text-purple-500" },
  { label: "出勤率", target: "95%", actual: "96%", score: 96, color: "text-teal-500" },
  { label: "團隊協作評分", target: "90分", actual: "88分", score: 88, color: "text-pink-500" },
];

export default function KPIReport() {
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const overall = Math.round(kpiItems.reduce((s, k) => s + k.score, 0) / kpiItems.length);

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white text-center shadow-lg">
        <div className="text-sm opacity-80 mb-1">本月整體KPI評分</div>
        <div className="text-6xl font-bold">{overall}</div>
        <div className="text-sm opacity-80 mt-1">/ 100分</div>
        <div className="mt-3 inline-block bg-white/20 px-4 py-1 rounded-full text-sm">
          {overall >= 90 ? "🏆 優秀" : overall >= 80 ? "👍 良好" : overall >= 70 ? "✅ 達標" : "⚠️ 需改進"}
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["2026-01", "2026-02", "2026-03"].map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedMonth === m ? "bg-purple-500 text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {m.replace("-", "年")}月
          </button>
        ))}
      </div>

      {/* Radar Chart */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-2">📊 KPI雷達圖</h3>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={kpiData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
            <Radar dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* KPI Items */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3">🎯 各項KPI詳情</h3>
        <div className="space-y-3">
          {kpiItems.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 font-medium">{item.label}</span>
                <span className={`font-bold ${item.color}`}>{item.score}分</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${item.score >= 90 ? "bg-green-400" : item.score >= 70 ? "bg-blue-400" : "bg-orange-400"}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>目標：{item.target}</span>
                <span>實際：{item.actual}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-2">📈 6個月趨勢</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}