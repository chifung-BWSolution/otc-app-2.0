import { CheckCircle, Clock, Users, Star, MessageSquare, Eye } from "lucide-react";

export function getStatusInfo(status, leaderName) {
  switch (status) {
    case "draft":
      return { label: "草稿", bg: "bg-orange-100", text: "text-orange-700", icon: Clock, iconColor: "text-orange-600", circleBg: "bg-orange-100" };
    case "peer_review_pending":
      return { label: "待完成同事互評", bg: "bg-amber-100", text: "text-amber-700", icon: Users, iconColor: "text-amber-600", circleBg: "bg-amber-100" };
    case "pending_leader":
      return { label: `待${leaderName || "Leader"}評分`, bg: "bg-blue-100", text: "text-blue-700", icon: Star, iconColor: "text-blue-600", circleBg: "bg-blue-100" };
    case "pending_boss_review":
      return { label: "待預審", bg: "bg-pink-100", text: "text-pink-700", icon: Eye, iconColor: "text-pink-600", circleBg: "bg-pink-100" };
    case "pending_boss":
      return { label: "待面談", bg: "bg-purple-100", text: "text-purple-700", icon: MessageSquare, iconColor: "text-purple-600", circleBg: "bg-purple-100" };
    case "completed":
      return { label: "已完成", bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, iconColor: "text-green-600", circleBg: "bg-green-100" };
    default:
      return { label: status, bg: "bg-gray-100", text: "text-gray-600", icon: Clock, iconColor: "text-gray-500", circleBg: "bg-gray-100" };
  }
}

export default function ReviewStatusBadge({ status, leaderName }) {
  const info = getStatusInfo(status, leaderName);
  return (
    <span className={`text-[11px] ${info.bg} ${info.text} px-2 py-0.5 rounded-full font-medium`}>
      {info.label}
    </span>
  );
}