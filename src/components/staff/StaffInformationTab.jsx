import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Loader2 } from "lucide-react";

const InfoRow = ({ label, value }) => value ? (
  <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
    <span className="text-gray-400 text-sm w-32 shrink-0">{label}</span>
    <span className="text-gray-800 text-sm font-medium break-all">{String(value)}</span>
  </div>
) : null;

export default function StaffInformationTab({ staffBubbleId }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffBubbleId) { setLoading(false); return; }
    base44.entities.StaffInformation.filter({ staff_id: staffBubbleId }, '-created_date', 1)
      .then(data => { setInfo(data[0] || null); setLoading(false); });
  }, [staffBubbleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" /> 載入中...
      </div>
    );
  }

  if (!info) {
    return (
      <div className="text-center py-16 text-gray-400">
        <FileText size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">沒有 Staff Information 資料</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">基本資料</h3>
        <InfoRow label="中文姓名" value={info.chinese_name} />
        <InfoRow label="英文姓名" value={info.english_name} />
        <InfoRow label="暱稱" value={info.nickname} />
        <InfoRow label="生日" value={info.birthday} />
        <InfoRow label="電話" value={info.phone} />
        <InfoRow label="住宅電話" value={info.residential_telephone} />
        <InfoRow label="Email 1" value={info.email1} />
        <InfoRow label="Email 2" value={info.email2} />
        <InfoRow label="婚姻狀況" value={info.marital_status} />
        <InfoRow label="籍貫" value={info.native_place} />
        <InfoRow label="通勤時間" value={info.commuting_time} />
        <InfoRow label="吸煙" value={info.is_smoking ? "是" : "否"} />
        <InfoRow label="無工作經驗" value={info.no_working_experience ? "是" : "否"} />
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">證件及銀行</h3>
        <InfoRow label="身份證號碼" value={info.identity_card_number} />
        <InfoRow label="回鄉證號碼" value={info.mainland_travel_permit_number} />
        <InfoRow label="銀行卡號碼" value={info.bank_card_number} />
        <InfoRow label="新銀行卡號碼" value={info.new_bank_card_number} />
        <InfoRow label="銀行名稱" value={info.bank_card_name} />
        <InfoRow label="銀行卡持有人" value={info.bank_card_owner} />

        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-6">地址</h3>
        <InfoRow label="中文通訊地址" value={info.chinese_mailing_address} />
        <InfoRow label="英文通訊地址" value={info.english_mailing_address} />

        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-6">同步資料</h3>
        <InfoRow label="Bubble ID" value={info.bubble_id} />
        <InfoRow label="Bubble 建立日期" value={info.bubble_created_date ? new Date(info.bubble_created_date).toLocaleString('zh-HK') : null} />
        <InfoRow label="Bubble 修改日期" value={info.bubble_modified_date ? new Date(info.bubble_modified_date).toLocaleString('zh-HK') : null} />
      </div>
    </div>
  );
}