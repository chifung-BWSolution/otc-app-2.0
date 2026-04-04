import { useState, useEffect } from "react";
import { Heart, Send, Gift, X, Smile } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { staffList } from "../data/staffData";

// Map staff birthdays by month (1-based) — using index as mock birthday month
const getBirthdayStaff = () => {
  const currentMonth = new Date().getMonth() + 1;
  // Use staff id % 12 + 1 as mock birthday month
  return staffList.filter((s) => (s.id % 12) + 1 === currentMonth);
};

const ecardOptions = [
  { emoji: "🎂", label: "生日蛋糕" },
  { emoji: "🎉", label: "派對" },
  { emoji: "🎁", label: "禮物" },
  { emoji: "🌟", label: "明星" },
  { emoji: "🥳", label: "慶祝" },
  { emoji: "🌸", label: "鮮花" },
];

const defaultMessages = [
  "生日快樂！祝你身體健康，萬事如意！",
  "生日快樂！願你的每一天都充滿歡笑！",
  "祝你生日快樂，工作順利，前途光明！",
  "生日快樂！感謝你一直以來的努力和付出！",
];

export default function BirthdayWidget() {
  const [birthdayStaff, setBirthdayStaff] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [showCardFor, setShowCardFor] = useState(null);
  const [selectedEmoji, setSelectedEmoji] = useState("🎂");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const yearMonth = new Date().toISOString().slice(0, 7);
  const monthName = `${new Date().getMonth() + 1}月`;

  useEffect(() => {
    const staff = getBirthdayStaff();
    setBirthdayStaff(staff);
    base44.auth.me().then(setCurrentUser).catch(() => {});
    loadWishes();
  }, []);

  const loadWishes = async () => {
    const data = await base44.entities.BirthdayWish.filter({ year_month: yearMonth });
    setWishes(data);
  };

  const getLikes = (email) => wishes.filter((w) => w.birthday_person_email === email && w.type === "like");
  const getCards = (email) => wishes.filter((w) => w.birthday_person_email === email && w.type === "ecard");
  const hasLiked = (email) => wishes.some((w) => w.birthday_person_email === email && w.sender_email === currentUser?.email && w.type === "like");

  const handleLike = async (person) => {
    if (!currentUser || hasLiked(person.gmail)) return;
    await base44.entities.BirthdayWish.create({
      birthday_person_email: person.gmail,
      birthday_person_name: person.name,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      type: "like",
      year_month: yearMonth,
    });
    loadWishes();
  };

  const handleSendCard = async () => {
    if (!currentUser || !showCardFor) return;
    setSending(true);
    await base44.entities.BirthdayWish.create({
      birthday_person_email: showCardFor.gmail,
      birthday_person_name: showCardFor.name,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      type: "ecard",
      message: message || defaultMessages[0],
      ecard_emoji: selectedEmoji,
      year_month: yearMonth,
    });
    setSending(false);
    setShowCardFor(null);
    setMessage("");
    setSelectedEmoji("🎂");
    loadWishes();
  };

  if (birthdayStaff.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🎂</span>
          <h3 className="font-bold text-gray-700 text-sm">{monthName}壽星</h3>
        </div>
        <p className="text-xs text-gray-400 text-center py-3">本月暫無壽星 🎉</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🎂</span>
          <h3 className="font-bold text-gray-800">{monthName}壽星</h3>
          <span className="ml-auto text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-bold">{birthdayStaff.length} 位</span>
        </div>

        <div className="space-y-3">
          {birthdayStaff.map((person) => {
            const likes = getLikes(person.gmail);
            const cards = getCards(person.gmail);
            const liked = hasLiked(person.gmail);

            return (
              <div key={person.id} className="bg-white rounded-xl p-3 border border-pink-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${person.color} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {person.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-sm">{person.name}</div>
                    <div className="text-xs text-gray-500">{person.team}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    {cards.length > 0 && <span>💌 {cards.length}</span>}
                  </div>
                </div>

                {/* Recent ecards preview */}
                {cards.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cards.slice(0, 3).map((c, i) => (
                      <div key={i} className="bg-pink-50 border border-pink-100 rounded-lg px-2 py-1 text-xs text-gray-700 flex items-center gap-1">
                        <span>{c.ecard_emoji}</span>
                        <span className="text-gray-500">{c.sender_name?.split(" ")[0]}</span>
                      </div>
                    ))}
                    {cards.length > 3 && <span className="text-xs text-gray-400 self-center">+{cards.length - 3} 張</span>}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => handleLike(person)}
                    disabled={liked || !currentUser}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      liked ? "bg-pink-100 text-pink-500 cursor-default" : "bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-500"
                    }`}
                  >
                    <Heart size={13} fill={liked ? "currentColor" : "none"} />
                    {liked ? "已點讚" : "點讚"} {likes.length > 0 && `(${likes.length})`}
                  </button>
                  <button
                    onClick={() => setShowCardFor(person)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-xs font-semibold hover:bg-purple-200 transition-colors"
                  >
                    <Gift size={13} /> 送賀卡
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ecard Modal */}
      {showCardFor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">送電子賀卡給 {showCardFor.name}</h3>
              <button onClick={() => setShowCardFor(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            {/* Emoji picker */}
            <div className="mb-3">
              <label className="text-xs font-bold text-gray-600 block mb-2">選擇賀卡主題</label>
              <div className="grid grid-cols-6 gap-2">
                {ecardOptions.map((opt) => (
                  <button
                    key={opt.emoji}
                    onClick={() => setSelectedEmoji(opt.emoji)}
                    className={`text-2xl p-2 rounded-xl transition-all ${selectedEmoji === opt.emoji ? "bg-purple-100 ring-2 ring-purple-400 scale-110" : "bg-gray-50 hover:bg-gray-100"}`}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="mb-3">
              <label className="text-xs font-bold text-gray-600 block mb-2">祝福語</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                rows={3}
                placeholder="輸入您的祝福語..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {defaultMessages.map((m, i) => (
                  <button key={i} onClick={() => setMessage(m)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-purple-100 hover:text-purple-600 transition-colors">
                    {m.slice(0, 10)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-3 mb-4 text-center border border-pink-100">
              <div className="text-4xl mb-1">{selectedEmoji}</div>
              <p className="text-sm font-bold text-gray-800">生日快樂，{showCardFor.name}！</p>
              {message && <p className="text-xs text-gray-600 mt-1">{message}</p>}
              <p className="text-xs text-gray-400 mt-1">— {currentUser?.full_name || "同事"}</p>
            </div>

            <button
              onClick={handleSendCard}
              disabled={sending}
              className="w-full bg-purple-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send size={15} /> {sending ? "發送中..." : "發送賀卡"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}