import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, TrendingUp, Users, Award, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

const PASS_SCORE = 85;

const scoreColor = (score) => {
  if (score >= 90) return "#22c55e";
  if (score >= 85) return "#3b82f6";
  if (score >= 70) return "#f59e0b";
  return "#ef4444";
};

export default function AssessmentDashboard() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("bu"); // "bu" | "team"

  useEffect(() => {
    base44.entities.AssessmentResult.list("-primary_exam_date", 500).then((data) => {
      setResults(data);
      setLoading(false);
    });
  }, []);

  // Group by BU or Team
  const grouped = {};
  for (const r of results) {
    const key = view === "bu" ? (r.team || "未分類") : (r.team || "未分類");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r.score || 0);
  }

  // Use team field as grouping (AssessmentResult has "team" field)
  // For BU grouping, we'll try to match via staff data if available, otherwise use team
  const chartData = Object.entries(grouped)
    .map(([name, scores]) => ({
      name: name.length > 8 ? name.slice(0, 8) + "…" : name,
      fullName: name,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
      pass: scores.filter((s) => s >= PASS_SCORE).length,
    }))
    .sort((a, b) => b.avg - a.avg);

  // Low scorers
  const lowScorers = results
    .filter((r) => (r.score || 0) < PASS_SCORE)
    .sort((a, b) => (a.score || 0) - (b.score || 0));

  // Stats
  const allScores = results.map((r) => r.score || 0);
  const avgScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
  const passCount = results.filter((r) => (r.score || 0) >= PASS_SCORE).length;
  const passRate = results.length ? Math.round((passCount / results.length) * 100) : 0;

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/assessment-results")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-800">考核成績儀表板</h2>
          <p className="text-xs text-gray-400">基於 {results.length} 條成績記錄</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">載入中...</div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Award size={40} className="mx-auto mb-2 opacity-30" />
          <p>尚無考核成績記錄</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{results.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">總考核人次</div>
            </div>
            <div className={`border rounded-xl p-3 text-center ${avgScore >= PASS_SCORE ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"}`}>
              <div className={`text-2xl font-bold ${avgScore >= PASS_SCORE ? "text-green-600" : "text-orange-500"}`}>{avgScore}</div>
              <div className="text-xs text-gray-500 mt-0.5">整體平均分</div>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{passRate}%</div>
              <div className="text-xs text-gray-500 mt-0.5">合格率 (≥{PASS_SCORE}分)</div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-500">{lowScorers.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">低分需跟進</div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700 text-sm flex items-center gap-1.5">
                <TrendingUp size={15} className="text-blue-500" /> 各團隊平均成績
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />≥90
                <span className="w-3 h-3 rounded-full bg-blue-400 inline-block ml-1" />≥85
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block ml-1" />≥70
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block ml-1" />&lt;70
              </div>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val, name, props) => [
                      `${val} 分 (${props.payload.pass}/${props.payload.count} 人合格)`,
                      props.payload.fullName,
                    ]}
                  />
                  <ReferenceLine y={PASS_SCORE} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `合格線 ${PASS_SCORE}`, fontSize: 11, fill: "#ef4444", position: "insideTopRight" }} />
                  <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={scoreColor(entry.avg)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-8 text-sm">沒有足夠數據</p>
            )}
          </div>

          {/* Team detail table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Users size={14} className="text-purple-500" />
              <span className="font-bold text-sm text-gray-700">團隊成績詳情</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 font-semibold">
                  <th className="px-4 py-2.5 text-left">團隊</th>
                  <th className="px-4 py-2.5 text-center">人數</th>
                  <th className="px-4 py-2.5 text-center">平均分</th>
                  <th className="px-4 py-2.5 text-center">合格人數</th>
                  <th className="px-4 py-2.5 text-center">合格率</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.fullName}</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{row.count}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: scoreColor(row.avg) }}>
                        {row.avg}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{row.pass}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-semibold ${Math.round(row.pass / row.count * 100) >= 80 ? "text-green-600" : "text-orange-500"}`}>
                        {Math.round(row.pass / row.count * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Low scorers alert */}
          {lowScorers.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-500" />
                <span className="font-bold text-sm text-red-700">需要跟進員工（成績低於 {PASS_SCORE} 分）</span>
                <span className="ml-auto text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full font-bold">{lowScorers.length} 人</span>
              </div>
              <div className="divide-y divide-gray-50">
                {lowScorers.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm font-bold text-red-600 shrink-0">
                      {(r.student_name || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800">{r.student_name}</div>
                      <div className="text-xs text-gray-400">{r.student_email} · {r.team || "未分類"} · {r.course_name}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-red-500">{r.score}</div>
                      <div className={`text-xs font-medium ${r.passing_status === "合格" ? "text-green-500" : r.passing_status === "需補考" ? "text-orange-500" : "text-red-500"}`}>
                        {r.passing_status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}