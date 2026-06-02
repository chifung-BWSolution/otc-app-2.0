import { useState, useRef } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { useStaffQA } from "@/hooks/useStaffQA";

function CategoryNav({ groups, onScrollTo }) {
  if (groups.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {groups.map((g, i) => (
        <button
          key={i}
          onClick={() => onScrollTo(i)}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors font-medium"
        >
          {g.category}
        </button>
      ))}
    </div>
  );
}

function QAGroupList({ groups, refs }) {
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
        <div key={gi} ref={el => refs.current[gi] = el}>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            {group.category}
          </h4>
          <div className="space-y-2">
            {group.items.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-sm font-semibold text-gray-700 mb-1">{item.question}</div>
                {item.is_option ? (
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {item.options.map((opt, oi) => (
                      <span
                        key={oi}
                        className={`text-xs px-3 py-1 rounded-full border ${
                          oi === item.selectedIndex
                            ? 'bg-blue-100 text-blue-700 border-blue-300 font-semibold'
                            : 'bg-white text-gray-400 border-gray-200'
                        }`}
                      >
                        {opt}
                      </span>
                    ))}
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
  const [activeTab, setActiveTab] = useState("skills");
  const skillRefs = useRef([]);
  const hobbyRefs = useRef([]);

  const scrollTo = (refs, index) => {
    const el = refs.current[index];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

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

  const tabs = [
    { key: "skills", label: "技能 Skills", count: skillsData.length },
    { key: "hobbies", label: "興趣 Hobbies", count: hobbiesData.length },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-gray-100 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-blue-200' : 'text-gray-400'}`}>
                ({tab.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Skills tab */}
      {activeTab === "skills" && (
        <div>
          <CategoryNav groups={skillsData} onScrollTo={(i) => scrollTo(skillRefs, i)} />
          <QAGroupList groups={skillsData} refs={skillRefs} />
        </div>
      )}

      {/* Hobbies tab */}
      {activeTab === "hobbies" && (
        <div>
          <CategoryNav groups={hobbiesData} onScrollTo={(i) => scrollTo(hobbyRefs, i)} />
          <QAGroupList groups={hobbiesData} refs={hobbyRefs} />
        </div>
      )}
    </div>
  );
}