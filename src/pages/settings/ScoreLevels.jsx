import ScoreLevelSettings from "@/components/settings/ScoreLevelSettings";

export default function ScoreLevels() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-lg font-bold text-gray-800">⭐ 自評分數設定</h2>
      <ScoreLevelSettings />
    </div>
  );
}
