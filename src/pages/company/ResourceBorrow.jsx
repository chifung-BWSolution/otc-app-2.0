import { useState } from "react";
import { Search, Settings, Plus } from "lucide-react";

const categories = [
  { label: "客戶送禮", count: 3 },
  { label: "宣傳物資", count: 4 },
  { label: "攝影工具", count: 4 },
  { label: "電子設備", count: 16 },
  { label: "佈置", count: 15 },
  { label: "工具", count: 31 },
  { label: "文具", count: 42 },
  { label: "其他", count: 14 },
  { label: "清潔用品", count: 1 },
  { label: "BW 物料", count: 60 },
  { label: "務絡/拜訪", count: 4 },
  { label: "客戶用品", count: 3 },
  { label: "公司活動用品", count: 9 },
  { label: "電子設備配件", count: 4 },
  { label: "公司文件", count: 4 },
  { label: "包裝/消毒用品", count: 14 },
  { label: "廚業用品", count: 5 },
];

const usageColor = {
  日常辦公: "bg-blue-100 text-blue-700",
  視像會議: "bg-purple-100 text-purple-700",
  拍攝: "bg-orange-100 text-orange-700",
  佈置: "bg-green-100 text-green-700",
  藍迪: "bg-teal-100 text-teal-700",
};

const resources = [
  {
    id: 1,
    name: "Video call headset 視像會議耳機+麥克風",
    image: "🎧",
    location: "香港 > 劣前外面 > T10",
    borrowMethod: "自行取用",
    returnMethod: "到期歸還",
    stock: 6,
    category: "電子設備",
    value: "$150",
    usage: "視像會議",
    user: "只限CFA同事",
  },
  {
    id: 2,
    name: "V1: 碼: 長碼；木: 瓶碼 V2: 圖碼: 延福碼; 插碼: 煙盒",
    image: "📦",
    location: "香港 > sever 房 > V1, V2",
    borrowMethod: "自行取用",
    returnMethod: "到期歸還",
    stock: 1,
    category: "攝影工具",
    value: "$999",
    usage: "拍攝",
    user: "只限CFA同事",
  },
  {
    id: 3,
    name: "餐天花板；廚房物品",
    image: "🍳",
    location: "香港 > sever 房 > V3",
    borrowMethod: "自行取用",
    returnMethod: "到期歸還",
    stock: 100,
    category: "其他",
    value: "$999",
    usage: "日常辦公",
    user: "只限CFA同事",
  },
  {
    id: 4,
    name: "辦公室裝飾",
    image: "🌿",
    location: "香港 > 門口排行處 > R1",
    borrowMethod: "自行取用",
    returnMethod: "到期歸還",
    stock: 10,
    category: "佈置",
    value: "$100",
    usage: "佈置",
    user: "只限CFA同事",
  },
  {
    id: 5,
    name: "酒房整器插板地布",
    image: "🔌",
    location: "香港 > Meeting Room 1 外面 > A1",
    borrowMethod: "自行取用",
    returnMethod: "到期歸還",
    stock: 1,
    category: "佈置",
    value: "$100",
    usage: "佈置",
    user: "只限CFA同事",
  },
  {
    id: 6,
    name: "辦公室活動Banner",
    image: "🎌",
    location: "香港 > Meeting Room 1 外面 > A2",
    borrowMethod: "自行取用",
    returnMethod: "到期歸還",
    stock: 1,
    category: "佈置",
    value: "$100",
    usage: "佈置",
    user: "只限CFA同事",
  },
  {
    id: 7,
    name: "辦公室節日裝飾",
    image: "🎄",
    location: "香港 > Meeting Room 1 外面 > A3",
    borrowMethod: "自行取用",
    returnMethod: "到期歸還",
    stock: 1,
    category: "佈置",
    value: "$100",
    usage: "佈置",
    user: "只限CFA同事",
  },
  {
    id: 8,
    name: "A5 Notebook 記事簿",
    image: "📓",
    location: "香港 > Meeting Room 1 外面 > A4",
    borrowMethod: "自行取用",
    returnMethod: "到期歸還",
    stock: 30,
    category: "文具",
    value: "$50",
    usage: "日常辦公",
    user: "只限CFA同事",
  },
  {
    id: 9,
    name: "遮塵樓",
    image: "🧹",
    location: "香港 > Meeting Room 1 外面 > A2",
    borrowMethod: "自行取用",
    returnMethod: "到期歸還",
    stock: 1,
    category: "工具",
    value: "$100",
    usage: "佈置",
    user: "只限CFA同事",
  },
  {
    id: 10,
    name: "Franco書",
    image: "📚",
    location: "香港 > Meeting Room 1 外面 > A4",
    borrowMethod: "自行取用",
    returnMethod: "到期歸還",
    stock: 5,
    category: "其他",
    value: "$999",
    usage: "藍迪",
    user: "只限CFA同事",
  },
  {
    id: 11,
    name: "透明卡套（細帶式）、卡套",
    image: "🗂️",
    location: "香港 > Meeting Room 1 外面",
    borrowMethod: "自行取用",
    returnMethod: "到期歸還",
    stock: 100,
    category: "文具",
    value: "$50",
    usage: "日常辦公",
    user: "只限CFA同事",
  },
];

export default function ResourceBorrow() {
  const [tab, setTab] = useState("概覽");
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("全部");

  const filtered = resources.filter(
    (r) =>
      (selectedCat === "全部" || r.category === selectedCat) &&
      (r.name.includes(search) || r.category.includes(search) || r.location.includes(search))
  );

  return (
    <div className="space-y-3">
      {/* Header tabs */}
      <div className="flex items-center gap-3">
        {["概覽", "借用記錄"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "概覽" && (
        <>
          {/* Filters row */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-wrap gap-2 items-center">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none">
              <option>香港</option>
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
              <option>域域</option>
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none min-w-32">
              <option>端號</option>
            </select>
            <div className="relative flex-1 min-w-40">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
                placeholder="搜尋..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors ml-auto">
              <Plus size={14} /> 新增物資
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCat("全部")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                selectedCat === "全部" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
              }`}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setSelectedCat(cat.label)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                  selectedCat === cat.label ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                }`}
              >
                {cat.label}({cat.count})
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold bg-gray-50">
                  <th className="px-3 py-3 text-left w-8">#</th>
                  <th className="px-3 py-3 text-left">物品</th>
                  <th className="px-3 py-3 text-left">位置</th>
                  <th className="px-3 py-3 text-left">借用方式</th>
                  <th className="px-3 py-3 text-left">歸還方式</th>
                  <th className="px-3 py-3 text-left">庫存</th>
                  <th className="px-3 py-3 text-left">分類</th>
                  <th className="px-3 py-3 text-left">借值</th>
                  <th className="px-3 py-3 text-left">使用用途</th>
                  <th className="px-3 py-3 text-left">主要使用者</th>
                  <th className="px-3 py-3 text-left">動作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                    <td className="px-3 py-3 text-xs text-gray-400">{idx + 1}.</td>
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2">
                        <span className="text-2xl shrink-0">{item.image}</span>
                        <span className="text-xs text-gray-800 leading-snug max-w-36">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 max-w-36 leading-snug">{item.location}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{item.borrowMethod}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{item.returnMethod}</td>
                    <td className="px-3 py-3 text-xs font-bold text-gray-800">{item.stock}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{item.category}</td>
                    <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{item.value}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${usageColor[item.usage] || "bg-gray-100 text-gray-600"}`}>
                        {item.usage}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{item.user}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button className="px-2 py-1 bg-yellow-400 text-white rounded text-xs font-medium hover:bg-yellow-500 whitespace-nowrap">借用</button>
                        <button className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 whitespace-nowrap">查看借用</button>
                        <button className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 whitespace-nowrap">編輯</button>
                        <button className="px-2 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 whitespace-nowrap">刪除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">沒有符合條件的物資</div>
            )}
          </div>
        </>
      )}

      {tab === "借用記錄" && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p>暫無借用記錄</p>
        </div>
      )}
    </div>
  );
}