// Centralized dimension config for Peer Review (score-based 1-5)
export const DIMENSIONS = [
  {
    key: "score_attitude",
    label: "工作態度與責任心",
    icon: "💼",
    description: "包括主動性、準時完成任務、對工作的投入程度等",
    color: "blue",
  },
  {
    key: "score_professionalism",
    label: "專業能力與執行品質",
    icon: "🎯",
    description: "包括專業技能水平、工作成果質量、效率等",
    color: "green",
  },
  {
    key: "score_teamwork",
    label: "團隊合作與溝通",
    icon: "🤝",
    description: "包括與同事協作能力、溝通效率、團隊精神等",
    color: "purple",
  },
  {
    key: "score_problem_solving",
    label: "問題解決與創新貢獻",
    icon: "💡",
    description: "包括面對困難的解決能力、創新思維、改善流程等",
    color: "orange",
  },
  {
    key: "score_company_contribution",
    label: "對公司整體發展的貢獻",
    icon: "🏢",
    description: "包括對公司目標的支持、跨部門協作、品牌提升等",
    color: "teal",
  },
];

export const DIMENSION_COLORS = {
  blue: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-800", active: "bg-blue-500" },
  green: { bg: "bg-green-50", border: "border-green-100", text: "text-green-800", active: "bg-green-500" },
  purple: { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-800", active: "bg-purple-500" },
  orange: { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-800", active: "bg-orange-500" },
  teal: { bg: "bg-teal-50", border: "border-teal-100", text: "text-teal-800", active: "bg-teal-500" },
};