import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ExamCenter() {
  const [currentUser, setCurrentUser] = useState(null);
  const [arrangements, setArrangements] = useState([]);
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
        if (u?.email) loadArrangements(u.email);
      });
    });
  }, []);

  const loadArrangements = async (email) => {
    setLoading(true);
    const arr = await base44.entities.AssessmentArrangement.filter({ student_email: email }, "-created_date", 100);
    setArrangements(arr);
    setLoading(false);
  };

  const startExam = async (arrangement) => {
    setSelectedArrangement(arrangement);
    const qs = await base44.entities.ExamQuestion.filter({ course_name: arrangement.course_name, status: "已發布" });
    setQuestions(qs);
    setUserAnswers({});
    setExamStarted(true);
    const mins = 60; // hardcoded for now
    setTimeLeft(mins * 60);
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
      attempt_number: 1
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
      remarks: ""
    });

    setExamResult({ score: totalScore, passing: passing, total: questions.reduce((s, q) => s + q.points, 0) });
    setSubmitting(false);
    setExamStarted(false);
  };

  if (examResult) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className={`rounded-2xl p-8 text-center text-white ${examResult.passing ? "bg-gradient-to-br from-green-400 to-green-600" : "bg-gradient-to-br from-red-400 to-red-600"}`}>
          <div className="text-6xl mb-4">{examResult.passing ? "✅" : "❌"}</div>
          <div className="text-3xl font-black mb-2">{examResult.score}/{examResult.total}</div>
          <div className="text-lg font-bold">{examResult.passing ? "合格" : "不合格"}</div>
        </div>
        <button onClick={() => { setExamResult(null); setSelectedArrangement(null); loadArrangements(currentUser.email); }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">返回考試列表</button>
      </div>
    );
  }

  if (examStarted && selectedArrangement) {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;

    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Timer */}
        <div className={`rounded-xl p-4 flex items-center justify-between ${timeLeft < 300 ? "bg-red-50 border-2 border-red-300" : "bg-blue-50 border border-blue-200"}`}>
          <div>
            <div className="text-xs text-gray-600">考試進行中</div>
            <div className="font-bold text-gray-900">{selectedArrangement.course_name}</div>
          </div>
          <div className={`text-3xl font-black ${timeLeft < 300 ? "text-red-600" : "text-blue-600"}`}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
        </div>

        {/* Questions */}
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
                      <input type="radio" name={q.id} value={opt} checked={userAnswers[q.id] === opt} onChange={e => setUserAnswers({...userAnswers, [q.id]: e.target.value})} className="rounded" />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === "判斷" && (
                <div className="flex gap-2">
                  {["正確", "錯誤"].map(opt => (
                    <button key={opt} onClick={() => setUserAnswers({...userAnswers, [q.id]: opt})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${userAnswers[q.id] === opt ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>{opt}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <button onClick={submitExam} disabled={submitting} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-60">
          <Send size={18} /> {submitting ? "提交中..." : "提交考試"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-black text-gray-900">考試中心</h2>
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : arrangements.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📝</div>
          <p>暫無分配的考核安排</p>
        </div>
      ) : (
        <div className="space-y-3">
          {arrangements.map(arr => (
            <div key={arr.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-lg text-gray-900">{arr.course_name}</div>
                  <div className="text-sm text-gray-600 mt-1">合格分數：<span className="font-bold text-gray-900">{arr.passing_score}</span></div>
                  <div className="text-xs text-gray-400 mt-0.5">考核次數：{arr.max_attempts}</div>
                </div>
                <button onClick={() => startExam(arr)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shrink-0">開始考試</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}