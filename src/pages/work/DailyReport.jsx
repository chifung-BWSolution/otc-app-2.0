import { useState } from "react";
import { Plus, CheckCircle } from "lucide-react";

export default function DailyReport() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ tasks: "", tomorrow: "", issues: "", hours: "8" });

  const today = new Date().toLocaleDateString("zh-HK", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  const handleSubmit = () => {
    setSubmitted(true);
    setShowForm(false);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Today Banner */}
      <div className="bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl p-4 text-white">
        <div className="text-sm opacity-80">今日日期</div>
        <div className="font-bold text-lg">{today}</div>
        <div className="text-sm opacity-80 mt-1">請於下班前提交今日工作匯報</div>
      </div>

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700">
          <CheckCircle size={18} /> 匯報已成功提交！
        </div>
      )}

      {/* Submit Today's Report */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
        >
          <Plus size={20} /> 提交今日匯報
        </button>
      ) : (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-700">📝 今日工作匯報</h3>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">今日完成工作 <span className="text-red-400">*</span></label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              rows={4}
              placeholder="請描述今日完成的工作內容..."
              value={form.tasks}
              onChange={(e) => setForm({ ...form, tasks: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">明日工作計劃</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              rows={3}
              placeholder="請描述明日的工作計劃..."
              value={form.tomorrow}
              onChange={(e) => setForm({ ...form, tomorrow: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">遇到的問題/需要支援</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              rows={2}
              placeholder="如有問題請填寫，無則填「無」..."
              value={form.issues}
              onChange={(e) => setForm({ ...form, issues: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">今日工作時數</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
            >
              {["4", "5", "6", "7", "8", "9", "10", "11", "12"].map((h) => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">✅ 提交匯報</button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">取消</button>
          </div>
        </div>
      )}

      {/* Past Reports */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3">📊 過往匯報</h3>
        <div className="text-center py-8 text-gray-400 text-sm">
          暫無過往匯報記錄
        </div>
      </div>
    </div>
  );
}