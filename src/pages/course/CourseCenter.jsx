import { useState, useEffect } from "react";
import { BookOpen, FileText, Calendar, GraduationCap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CourseList from "../../components/course/CourseList";
import ResourceLibrary from "../../components/course/ResourceLibrary";
import WeeklyKnowledgeTab from "../../components/course/WeeklyKnowledgeTab";
import WorkshopTab from "../../components/course/WorkshopTab";

const TABS = [
  { key: "courses", label: "課程列表", icon: GraduationCap },
  { key: "resources", label: "資源庫", icon: BookOpen },
  { key: "weekly", label: "每週知識匯報", icon: FileText },
  { key: "workshops", label: "培訓工作坊", icon: Calendar },
];

export default function CourseCenter() {
  const [tab, setTab] = useState("courses");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-teal-500 text-teal-600 bg-teal-50"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={18} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {tab === "courses" && <CourseList />}
      {tab === "resources" && <ResourceLibrary currentUser={currentUser} />}
      {tab === "weekly" && <WeeklyKnowledgeTab currentUser={currentUser} />}
      {tab === "workshops" && <WorkshopTab currentUser={currentUser} />}
    </div>
  );
}