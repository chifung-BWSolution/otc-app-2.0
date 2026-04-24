// Centralized question config for Peer Review
export const QUESTIONS = [
  {
    key: "q1_encourage_strength",
    section: "encourage",
    sectionLabel: "🌟 鼓勵",
    sectionColor: "blue",
    label: "1. 這位同事在哪一方面表現得最出色？",
    options: [
      { value: "A", label: "解決複雜問題的能力" },
      { value: "B", label: "積極主動，承擔額外責任" },
      { value: "C", label: "樂於分享知識，幫助他人成長" },
      { value: "D", label: "保持積極態度，激勵團隊士氣" },
    ],
  },
  {
    key: "q2_encourage_growth",
    section: "encourage",
    sectionLabel: "🌟 鼓勵",
    sectionColor: "blue",
    label: "2. 你會鼓勵這位同事繼續在哪方面發展？",
    options: [
      { value: "A", label: "拓展新的技能領域" },
      { value: "B", label: "在團隊中扮演更重要的領導角色" },
      { value: "C", label: "更大膽地提出創新想法" },
      { value: "D", label: "持續優化工作流程或效率" },
    ],
  },
  {
    key: "q3_thanks_support",
    section: "thanks",
    sectionLabel: "🙏 多謝",
    sectionColor: "green",
    label: "3. 你最想感謝這位同事在哪方面的支持？",
    options: [
      { value: "A", label: "在我遇到困難時提供及時協助" },
      { value: "B", label: "主動分擔我的工作量，減輕壓力" },
      { value: "C", label: "提供了有價值的建議或見解" },
      { value: "D", label: "維護團隊和諧，營造良好工作氛圍" },
    ],
  },
  {
    key: "q4_thanks_impact",
    section: "thanks",
    sectionLabel: "🙏 多謝",
    sectionColor: "green",
    label: "4. 這位同事的哪一個行動對你的工作產生了積極影響？",
    options: [
      { value: "A", label: "主動溝通，確保資訊透明" },
      { value: "B", label: "及時回饋，讓我能快速調整" },
      { value: "C", label: "嚴謹細緻，避免了潛在錯誤" },
      { value: "D", label: "成功完成了某項艱鉅任務" },
    ],
  },
  {
    key: "q5_improve_collab",
    section: "improve",
    sectionLabel: "💡 改善",
    sectionColor: "orange",
    label: "5. 這位同事在未來可以如何進一步提升團隊協作效率？",
    options: [
      { value: "A", label: "更頻繁地分享工作進度" },
      { value: "B", label: "更積極地參與討論和決策" },
      { value: "C", label: "在跨部門合作中扮演更協調的角色" },
      { value: "D", label: "在時間管理和任務分配上更加清晰" },
    ],
  },
  {
    key: "q6_improve_growth",
    section: "improve",
    sectionLabel: "💡 改善",
    sectionColor: "orange",
    label: "6. 為了個人專業成長，你會建議這位同事在哪一方面加強？",
    options: [
      { value: "A", label: "提升某一特定專業技能" },
      { value: "B", label: "學習如何更有效地給予和接受回饋" },
      { value: "C", label: "改善公眾演講或展示能力" },
      { value: "D", label: "更好地平衡工作與個人生活，避免過度勞累" },
    ],
  },
];

export const SECTION_COLORS = {
  blue: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-800", optionActive: "bg-blue-100 border-blue-400 text-blue-800", optionHover: "hover:bg-blue-50" },
  green: { bg: "bg-green-50", border: "border-green-100", text: "text-green-800", optionActive: "bg-green-100 border-green-400 text-green-800", optionHover: "hover:bg-green-50" },
  orange: { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-800", optionActive: "bg-orange-100 border-orange-400 text-orange-800", optionHover: "hover:bg-orange-50" },
};