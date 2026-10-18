import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Dices, Flame, ChevronUp, ChevronDown } from 'lucide-react';
import { ExpenseRecord } from '../types/expense';

interface MascotBannerProps {
  records: ExpenseRecord[];
  monthlyBudget: number;
}

const MONEY_TIPS = [
  '今日開運小撇步：午餐自備環保杯，省新手搖飲料 50 元！運勢大吉 🧋✨',
  '小豬箴言：不是買特價品省錢，而是不買不需要的東西！💡',
  '今日挑戰：試試看今晚親自煮一餐，健康又省荷包！🥗🍲',
  '理財小冷知識：每天省下 70 元咖啡錢定期投資，30 年能滾出數百萬！☕📈',
  '小豬招財術：每次衝動想買東西時，先在購物車放 24 小時！🛒⏳',
  '超棒的習慣：每天睡前花 30 秒記帳，你已經超越 90% 的人了！🌟👏',
];

export const MascotBanner: React.FC<MascotBannerProps> = ({ records, monthlyBudget }) => {
  const [currentTip, setCurrentTip] = useState<string | null>(null);
  const [isWiggling, setIsWiggling] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate current month's expense
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayKey = now.toISOString().split('T')[0];

  const thisMonthRecords = records.filter((r) => r.date.startsWith(currentMonthKey));
  const todayRecords = records.filter((r) => r.date === todayKey);

  const thisMonthExpense = thisMonthRecords
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const todayExpense = todayRecords
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const budgetRatio = monthlyBudget > 0 ? (thisMonthExpense / monthlyBudget) * 100 : 0;

  // Streak calculation (days with at least 1 record)
  const uniqueDates = Array.from(new Set(records.map((r) => r.date))).sort().reverse();
  const streak = uniqueDates.length;

  // Dynamic Piggy reaction
  let piggyEmoji = '🐷';
  let moodTitle = '小豬金庫守護中';
  let dialogue = '嗨！我是你的生活理財小夥伴～今天過得如何？';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';

  if (records.length === 0) {
    piggyEmoji = '🐷✨';
    moodTitle = '新帳本準備就緒！';
    dialogue = '全新的乾淨記帳本！點擊「記一筆」為小豬存下第一筆生活開銷吧～';
  } else if (todayExpense === 0) {
    piggyEmoji = '🥳';
    moodTitle = '今日零開銷達成！';
    dialogue = '太自律了！今天目前還沒有任何支出，小豬為你鼓掌！';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
  } else if (budgetRatio > 100) {
    piggyEmoji = '😱';
    moodTitle = '預算拉警報！';
    dialogue = `本月開銷已超出預算 NT$ ${(thisMonthExpense - monthlyBudget).toLocaleString()}，小豬幫你一起拉緊荷包！`;
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
  } else if (budgetRatio > 80) {
    piggyEmoji = '🧐';
    moodTitle = '預算已用 80%';
    dialogue = '本月額度快到警戒線囉，接下來的日子讓我們精打細算一點點！';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
  } else {
    piggyEmoji = '🥰';
    moodTitle = '財務狀況健康！';
    dialogue = `本月已記帳 ${thisMonthRecords.length} 筆，預算進度良好，繼續保持！`;
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }

  // Interactive tap: wiggle + confetti + random fortune
  const handlePiggyTap = (e: React.MouseEvent) => {
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 600);

    // Trigger joyful mini confetti
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.35, x: 0.5 },
      colors: ['#10b981', '#f59e0b', '#ec4899', '#6366f1'],
    });

    const randomTip = MONEY_TIPS[Math.floor(Math.random() * MONEY_TIPS.length)];
    setCurrentTip(randomTip);
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 via-emerald-50/60 to-teal-50 border border-emerald-100/80 rounded-3xl p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all duration-300">
      {/* Background cute coins pattern */}
      <div className="absolute right-2 -bottom-2 text-6xl opacity-10 pointer-events-none select-none">
        🪙🐖✨
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          {/* Animated Mascot Avatar Button */}
          <button
            type="button"
            onClick={handlePiggyTap}
            title="點擊小豬抽今日省錢開運籤！"
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-md border border-amber-200/80 flex items-center justify-center text-2xl sm:text-3xl shrink-0 cursor-pointer transform active:scale-90 transition-all hover:rotate-6 hover:shadow-lg ${
              isWiggling ? 'animate-bounce' : ''
            }`}
          >
            <span>{piggyEmoji}</span>
          </button>

          {/* Dialogue & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                {moodTitle}
              </span>

              {streak > 0 && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                  已累積 {streak} 天紀錄
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-1 truncate sm:text-wrap">
              {currentTip || dialogue}
            </p>
          </div>
        </div>

        {/* Right Action: Tip Die Button & Collapse */}
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button
            type="button"
            onClick={handlePiggyTap}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer active:scale-95"
          >
            <Dices className="w-3.5 h-3.5 text-amber-600" />
            <span>抽開運籤</span>
          </button>
        </div>
      </div>
    </div>
  );
};
