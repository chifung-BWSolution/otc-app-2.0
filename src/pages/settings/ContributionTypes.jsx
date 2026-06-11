import ContributionTypeSettings from "@/components/settings/ContributionTypeSettings";

export default function ContributionTypes() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-lg font-bold text-gray-800">📝 貢獻類型設定</h2>
      <ContributionTypeSettings />
    </div>
  );
}
