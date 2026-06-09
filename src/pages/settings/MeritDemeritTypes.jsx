import MeritDemeritTypeSettings from "@/components/settings/MeritDemeritTypeSettings";

export default function MeritDemeritTypes() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-lg font-bold text-gray-800">⚖️ 功過類型設定</h2>
      <MeritDemeritTypeSettings />
    </div>
  );
}
