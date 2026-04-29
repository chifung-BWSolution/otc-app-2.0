import { FileText, Plus, Eye, Pencil, Users } from "lucide-react";
import ReviewStatusBadge, { getStatusInfo } from "./ReviewStatusBadge";

export default function AnnualReviewList({ reviews, staffRec, user, leaderName, onCreateNew, onOpen, onPeerReview }) {
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
            const isDraft = r.status === "draft";
            const statusInfo = getStatusInfo(r.status, leaderName);
            const StatusIcon = statusInfo.icon;
            const canEdit = isDraft;
            const showPeerReview = r.status === "peer_review_pending"; // only show when waiting for peer review

            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onOpen(r)}>
                <div className="flex items-center gap-3 p-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusInfo.circleBg}`}>
                    <StatusIcon size={18} className={statusInfo.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{r.fiscal_year}</span>
                      <ReviewStatusBadge status={r.status} leaderName={leaderName} />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {r.project_count || r.project_contributions?.length || 0} 個項目
                      {r.submitted_at && <span> · 提交於 {new Date(r.submitted_at).toLocaleDateString("zh-HK")}</span>}
                      {isDraft && <span> · 上次更新 {new Date(r.updated_date || r.created_date).toLocaleDateString("zh-HK")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {showPeerReview && (
                      <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white">
                        <Users size={13} /> 進行互評
                      </span>
                    )}
                    {!showPeerReview && (
                      <span className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                        canEdit
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {canEdit ? <><Pencil size={13} /> 編輯</> : <><Eye size={13} /> 查看</>}
                      </span>
                    )}
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