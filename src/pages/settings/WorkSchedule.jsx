import WorkScheduleSettings from "@/components/settings/WorkScheduleSettings";

export default function WorkSchedule() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-lg font-bold text-gray-800">⏰ 上班時間設定</h2>
      <WorkScheduleSettings />
    </div>
  );
}
