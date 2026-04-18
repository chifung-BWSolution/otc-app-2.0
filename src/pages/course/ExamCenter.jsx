import { useState, useEffect } from "react";
import { Clock, CalendarClock, Send, BookOpen, AlertCircle, CheckCircle2, PlayCircle, Award, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

const statusColor = {
  "未開始": "bg-gray-100 text-gray-700 border-gray-200",
  "進行中": "bg-blue-100 text-blue-700 border-blue-200",
  "已完成": "bg-green-100 text-green-700 border-green-200",
};

export default function ExamCenter() {
  const [currentUser, setCurrentUser] = useState(null);
  const [arrangements, setArrangements] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [selectedArrangement, setSelectedArrangement] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [examResult, setExamResult] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(authed => {
      if (!authed) { setLoading(false); return; }
      base44.auth.me().then(u => {
        setCurrentUser(u);
        if (u?.email) loadAll(u);
      });
    });
  }, []);

  // Subscribe to real-time changes so that when Admin 新增/更新 考核安排 或 成績，學員立即看到
  useEffect(() => {
    if (!currentUser?.email) return;
    const unsubA = base44.entities.AssessmentArrangement.subscribe(() => loadArrangements(currentUser.email));
    const unsubR = base44.entities.AssessmentResult.subscribe(() => loadResults(currentUser));
    return () => { unsubA?.(); unsubR?.(); };
  }, [currentUser?.email]);

  const loadAll = async (u) => {
    setLoading(true);
    await Promise.all([loadArrangements(u.email), loadResults(u)]);
    setLoading(false);
  };

  const loadArrangements = async (email) => {
    const arr = await base44.entities.AssessmentArrangement.filter({ student_email: email }, "-created_date", 100);
    setArrangements(arr);
  };

  const loadResults = async (u) => {
    // Match by email OR name (匯入 Excel 成績可能無 email)
    const [byEmail, byName] = await Promise.all([
      u.email ? base44.entities.AssessmentResult.filter({ student_email: u.email }, "-created_date", 200) : Promise.resolve([]),
      u.full_name ? base44.entities.AssessmentResult.filter({ student_name: u.full_name }, "-created_date", 200) : Promise.resolve([]),
    ]);
    const map = new Map();
    [...byEmail, ...byName].forEach(r => map.set(r.id, r));
    setMyResults(Array.from(map.values()).sort((a, b) =>
      (b.primary_exam_date || b.created_date || "").localeCompare(a.primary_exam_date || a.created_date || "")
    ));
  };

  const startExam = async (arrangement) => {
    setSelectedArrangement(arrangement);
    const qs = await base44.entities.ExamQuestion.filter({ course_name: arrangement.course_name, status: "已發布" });
    setQuestions(qs);
    setUserAnswers({});
    setExamStarted(true);
    setTimeLeft(60 * 60);
  };

  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [examStarted, timeLeft]);

  const submitExam = async () => {
    setSubmitting(true);
    let totalScore = 0;
    const now = new Date().toLocaleString("zh-CN");

    questions.forEach(q => {
      if (userAnswers[q.id] === q.correct_answer) totalScore += q.points;
    });

    const passing = totalScore >= selectedArrangement.passing_score;

    await base44.entities.ExamResult.create({
      arrangement_id: selectedArrangement.id,
      student_email: currentUser.email,
      student_name: currentUser.full_name,
      course_name: selectedArrangement.course_name,
      exam_start_time: new Date().toISOString(),
      exam_end_time: new Date().toISOString(),
      answers: userAnswers,
      score: totalScore,
      passing_score: selectedArrangement.passing_score,
      passing_status: passing ? "合格" : "不合格",
      submitted_at: now,
      attempt_number: 1,
    });

    await base44.entities.AssessmentResult.create({
      student_email: currentUser.email,
      student_name: currentUser.full_name,
      course_name: selectedArrangement.course_name,
      team: selectedArrangement.team,
      office: "",
      score: totalScore,
      passing_status: passing ? "合格" : "不合格",
      primary_exam_date: selectedArrangement.assessment_date,
      primary_exam_score: totalScore,
      exam_result_id: "",
      remarks: "",
    });

    // Mark arrangement as completed
    await base44.entities.AssessmentArrangement.update(selectedArrangement.id, { status: "已完成" });

    setExamResult({ score: totalScore, passing, total: questions.reduce((s, q) => s + q.points, 0) });
    setSubmitting(false);
    setExamStarted(false);
  };

  // === Result view ===
  if (examResult) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className={`rounded-2xl p-8 text-center text-white ${examResult.passing ? "bg-gradient-to-br from-green-400 to-green-600" : "bg-gradient-to-br from-red-400 to-red-600"}`}>
          <div className="text-6xl mb-4">{examResult.passing ? "✅" : "❌"}</div>
          <div className="text-3xl font-black mb-2">{examResult.score}/{examResult.total}</div>
          <div className="text-lg font-bold">{examResult.passing ? "合格" : "不合格"}</div>
        </div>
        <button onClick={() => { setExamResult(null); setSelectedArrangement(null); loadAll(currentUser); }}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">返回考試列表</button>
      </div>
    );
  }

  // === Taking exam view ===
  if (examStarted && selectedArrangement) {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className={`rounded-xl p-4 flex items-center justify-between ${timeLeft < 300 ? "bg-red-50 border-2 border-red-300" : "bg-blue-50 border border-blue-200"}`}>
          <div>
            <div className="text-xs text-gray-600">考試進行中</div>
            <div className="font-bold text-gray-900">{selectedArrangement.course_name}</div>
          </div>
          <div className={`text-3xl font-black ${timeLeft < 300 ? "text-red-600" : "text-blue-600"}`}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs font-bold text-gray-500 mb-1">第 {idx + 1} 題 (共 {questions.length} 題)</div>
                  <div className="text-sm font-semibold text-gray-900">{q.question_text}</div>
                </div>
                <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full shrink-0">{q.points} 分</span>
              </div>

              {q.question_type === "單選" && (
                <div className="space-y-2">
                  {q.options?.map((opt, i) => (
                    <label key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="radio" name={q.id} value={opt} checked={userAnswers[q.id] === opt}
                        onChange={e => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })} />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === "判斷" && (
                <div className="flex gap-2">
                  {["正確", "錯誤"].map(opt => (
                    <button key={opt} onClick={() => setUserAnswers({ ...userAnswers, [q.id]: opt })}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold ${userAnswers[q.id] === opt ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={submitExam} disabled={submitting}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-60">
          <Send size={18} /> {submitting ? "提交中..." : "提交考試"}
        </button>
      </div>
    );
  }

  // === Arrangement list view ===
  const now = new Date();
  const upcoming = arrangements.filter(a => a.status !== "已完成");
  const finished = arrangements.filter(a => a.status === "已完成");

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-black">📚 我的考試中心</h2>
        <p className="text-sm opacity-90 mt-1">由行政部為您安排的課程考核</p>
        <div className="flex gap-3 mt-3 flex-wrap">
          <StatBadge label="待考試" value={upcoming.length} />
          <StatBadge label="已完成安排" value={finished.length} />
          <StatBadge label="成績記錄" value={myResults.length} />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : arrangements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed text-gray-400">
          <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
          <p>暫未為您安排任何考核</p>
          <p className="text-xs mt-1">當行政部安排考核後，這裡會自動顯示</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-2">🎯 待完成考試</h3>
              <div className="space-y-2">
                {upcoming.map(arr => <ArrangementCard key={arr.id} arr={arr} now={now} onStart={() => startExam(arr)} />)}
              </div>
            </div>
          )}
          {finished.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-2 mt-4">✅ 已完成考試</h3>
              <div className="space-y-2">
                {finished.map(arr => <ArrangementCard key={arr.id} arr={arr} now={now} onStart={() => startExam(arr)} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* My Results */}
      {myResults.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-2 mt-4 flex items-center gap-1.5">
            <Award size={14} className="text-amber-500" /> 我的考核成績
          </h3>
          <div className="space-y-2">
            {myResults.map(r => <ResultCard key={r.id} result={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ result }) {
  const finalScore = result.retest_exam_score ?? result.primary_exam_score ?? result.score;
  const hasRetest = result.retest_exam_score != null && result.retest_exam_score !== "";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base text-gray-900">{result.course_name}</div>
          {result.assessment_type && <div className="text-xs text-gray-500 mt-0.5">{result.assessment_type}</div>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
            {result.primary_exam_date && (
              <span className="flex items-center gap-1">
                <CalendarClock size={12} className="text-blue-500" />
                正考：{String(result.primary_exam_date).slice(0, 10)}
                {result.primary_exam_score != null && <b className="ml-1">{result.primary_exam_score} 分</b>}
              </span>
            )}
            {hasRetest && (
              <span className="flex items-center gap-1">
                <TrendingUp size={12} className="text-orange-500" />
                補考：{result.retest_exam_date ? String(result.retest_exam_date).slice(0, 10) : "—"}
                <b className="ml-1">{result.retest_exam_score} 分</b>
              </span>
            )}
            {result.team && <span className="text-gray-400">團隊：{result.team}</span>}
          </div>
          {result.remarks && <div className="text-xs text-gray-400 italic mt-1">備註：{result.remarks}</div>}
        </div>
        <div className="shrink-0 text-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl px-4 py-2 min-w-[72px]">
          <div className="text-xs opacity-90">最終分數</div>
          <div className="text-2xl font-black">{finalScore ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value }) {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </div>
  );
}

function ArrangementCard({ arr, now, onStart }) {
  const start = arr.assessment_date ? new Date(arr.assessment_date) : null;
  const end = arr.assessment_end_date ? new Date(arr.assessment_end_date) : null;
  const notYetOpen = start && start > now;
  const expired = end && end < now && arr.status !== "已完成";
  const isDone = arr.status === "已完成";
  const canStart = !notYetOpen && !expired && !isDone;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[arr.status] || "bg-gray-100 text-gray-600"}`}>
              {arr.status}
            </span>
            {arr.course_code && <span className="text-xs text-gray-400">{arr.course_code}</span>}
          </div>
          <div className="font-bold text-base text-gray-900">{arr.course_name}</div>

          <div className="mt-2 space-y-1 text-xs text-gray-600">
            {start && (
              <div className="flex items-center gap-1.5">
                <CalendarClock size={12} className="text-blue-500" />
                <span>
                  {start.toLocaleString("zh-HK", { dateStyle: "short", timeStyle: "short" })}
                  {end && ` 至 ${end.toLocaleString("zh-HK", { dateStyle: "short", timeStyle: "short" })}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> 合格分：<b>{arr.passing_score}</b></span>
              <span className="flex items-center gap-1"><Clock size={12} className="text-orange-500" /> 可考：<b>{arr.max_attempts}</b> 次</span>
            </div>
            {arr.remarks && <div className="text-gray-400 italic">備註：{arr.remarks}</div>}
          </div>
        </div>

        <div className="shrink-0">
          {notYetOpen && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1">
              <AlertCircle size={12} /> 尚未開放
            </div>
          )}
          {expired && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">已逾期</div>
          )}
          {isDone && (
            <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">已完成</div>
          )}
          {canStart && (
            <button onClick={onStart}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5">
              <PlayCircle size={14} /> 開始考試
            </button>
          )}
        </div>
      </div>
    </div>
  );
}