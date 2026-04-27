import { FileText, CheckCircle, Clock, Plus, Eye, Pencil, Users } from "lucide-react";

export default function AnnualReviewList({ reviews, staffRec, user, onCreateNew, onOpen, onPeerReview }) {
  const name = staffRec?.display_name || user?.full_name || "";

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <FileText size={24} />
          <div>
            <h2 className="text-lg font-bold">年度工作表現評估表</h2>
            <p className="text-sm opacity-80">{name} · {staffRec?.team_name || ""} · {staffRec?.position || ""}</p>
          </div>
        </div>
      </div>

      {/* New review button */}
      <button
        onClick={onCreateNew}
        className="w-full flex items-center gap-3 bg-white border-2 border-dashed border-indigo-300 rounded-xl p-4 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <Plus size={20} />
        </div>
        <div className="text-left">
          <div className="font-semibold text-sm">填寫新年度評估表</div>
          <div className="text-xs text-gray-400">系統會自動讀取上個財政年度的工時數據</div>
        </div>
      </button>

      {/* Existing reviews */}
      {reviews.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-600 px-1">已有的評估表（{reviews.length}）</h3>
          {reviews.map(r => {
            const isSubmitted = r.status === "submitted";
            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 p-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSubmitted ? "bg-green-100" : "bg-orange-100"}`}>
                    {isSubmitted ? <CheckCircle size={18} className="text-green-600" /> : <Clock size={18} className="text-orange-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">{r.fiscal_year}</span>
                      {isSubmitted ? (
                        <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">已提交</span>
                      ) : (
                        <span className="text-[11px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">草稿</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {r.project_contributions?.length || 0} 個項目
                      {isSubmitted && r.submitted_at && (
                        <span> · 提交於 {new Date(r.submitted_at).toLocaleDateString("zh-HK")}</span>
                      )}
                      {!isSubmitted && (
                        <span> · 上次更新 {new Date(r.updated_date || r.created_date).toLocaleDateString("zh-HK")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSubmitted && onPeerReview && (
                      <button
                        onClick={() => onPeerReview()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                      >
                        <Users size={13} /> 同事互評
                      </button>
                    )}
                    <button
                      onClick={() => onOpen(r)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isSubmitted
                          ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {isSubmitted ? <><Eye size={13} /> 查看</> : <><Pencil size={13} /> 編輯</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviews.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          暫時未有任何評估表記錄，按上方按鈕開始填寫。
        </div>
      )}
    </div>
  );
}