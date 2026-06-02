import { Loader2, MessageSquare } from "lucide-react";
import { useStaffQA } from "@/hooks/useStaffQA";

function QAGroupList({ groups }) {
  if (groups.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">暫無記錄</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group, gi) => (
        <div key={gi}>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            {group.category}
          </h4>
          <div className="space-y-2">
            {group.items.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-sm font-semibold text-gray-700 mb-1">{item.question}</div>
                {item.is_option ? (
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {item.options.map((opt, oi) => {
                      const isSelected = oi === item.selectedIndex;
                      return (
                        <span
                          key={oi}
                          className={`text-xs px-3 py-1 rounded-full border ${
                            isSelected
                              ? 'bg-blue-100 text-blue-700 border-blue-300 font-semibold'
                              : 'bg-white text-gray-400 border-gray-200'
                          }`}
                        >
                          {opt}
                        </span>
                      );
                    })}
                    {item.option_point != null && (
                      <span className="text-xs text-blue-500 self-center ml-1">({item.option_point}分)</span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {item.answer || <span className="text-gray-300">（未填寫）</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StaffQASection({ staffBubbleId }) {
  const { skillsData, hobbiesData, loading } = useStaffQA(staffBubbleId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (skillsData.length === 0 && hobbiesData.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10">
        <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
        <p>暫無 Q&A 記錄</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-gray-100 pb-2">
          <MessageSquare size={13} /> 技能 Skills
        </h3>
        <QAGroupList groups={skillsData} />
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-gray-100 pb-2">
          <MessageSquare size={13} /> 興趣 Hobbies
        </h3>
        <QAGroupList groups={hobbiesData} />
      </div>
    </div>
  );
}