import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Sparkles,
  Download,
  AlertCircle,
  PiggyBank,
  Edit2,
  Check,
} from 'lucide-react';
import { ExpenseRecord, MonthlyBudget } from '../types/expense';
import { ALL_CATEGORIES, PAYMENT_METHODS } from '../constants/categories';
import { CategoryIcon } from './CategoryIcon';
import { exportExpensesToExcel } from '../services/excelExport';
import confetti from 'canvas-confetti';

interface MonthlyReportProps {
  records: ExpenseRecord[];
  budgets: MonthlyBudget;
  onUpdateBudget: (month: string, amount: number) => void;
  onSelectCategory?: (category: string) => void;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  records,
  budgets,
  onUpdateBudget,
  onSelectCategory,
}) => {
  // Current selected month: default to current month YYYY-MM
  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);

  // Budget editing state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const currentBudget = budgets[selectedMonth] ?? 30000;
  const [budgetInput, setBudgetInput] = useState<string>(currentBudget.toString());

  // Interactive hovered slice in Donut Chart
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Available months in records
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentYearMonth);
    records.forEach((r) => set.add(r.date.substring(0, 7)));
    return Array.from(set).sort().reverse();
  }, [records, currentYearMonth]);

  // Month navigation
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
    setBudgetInput((budgets[newMonth] ?? 30000).toString());
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
    setBudgetInput((budgets[newMonth] ?? 30000).toString());
  };

  // Records for current selected month
  const monthRecords = useMemo(() => {
    return records.filter((r) => r.date.startsWith(selectedMonth));
  }, [records, selectedMonth]);

  // Month Statistics
  const stats = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    const paymentTotals: Record<string, number> = {};
    const dailyExpenses: Record<string, number> = {};

    // Determine number of days in this month
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Initialize all days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayKey = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      dailyExpenses[dayKey] = 0;
    }

    monthRecords.forEach((r) => {
      if (r.type === 'expense') {
        totalExpense += r.amount;
        if (!categoryTotals[r.category]) {
          categoryTotals[r.category] = { total: 0, count: 0 };
        }
        categoryTotals[r.category].total += r.amount;
        categoryTotals[r.category].count += 1;

        paymentTotals[r.paymentMethod] = (paymentTotals[r.paymentMethod] || 0) + r.amount;

        if (dailyExpenses[r.date] !== undefined) {
          dailyExpenses[r.date] += r.amount;
        } else {
          dailyExpenses[r.date] = r.amount;
        }
      } else {
        totalIncome += r.amount;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const dailyAverage = daysInMonth > 0 ? totalExpense / daysInMonth : 0;

    // Sort categories by spend descending
    const categoryList = Object.entries(categoryTotals)
      .map(([name, data]) => {
        const catInfo = ALL_CATEGORIES.find((c) => c.name === name);
        return {
          name,
          total: data.total,
          count: data.count,
          percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
          color: catInfo?.color || '#64748b',
          icon: catInfo?.icon || 'MoreHorizontal',
          emoji: catInfo?.emoji || '📝',
          bgColor: catInfo?.bgColor || '#f1f5f9',
        };
      })
      .sort((a, b) => b.total - a.total);

    // Peak day
    let peakDay = '';
    let peakAmount = 0;
    Object.entries(dailyExpenses).forEach(([day, amt]) => {
      if (amt > peakAmount) {
        peakAmount = amt;
        peakDay = day;
      }
    });

    return {
      totalExpense,
      totalIncome,
      netSavings,
      savingsRate,
      dailyAverage,
      daysInMonth,
      categoryList,
      paymentTotals,
      dailyExpenses,
      peakDay,
      peakAmount,
    };
  }, [monthRecords, selectedMonth]);

  // Historical 6 Months comparison data
  const historyData = useMemo(() => {
    const [currY, currM] = selectedMonth.split('-').map(Number);
    const months: { month: string; label: string; expense: number; income: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currY, currM - 1 - i, 1);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.getMonth() + 1}月`;

      let exp = 0;
      let inc = 0;
      records.forEach((r) => {
        if (r.date.startsWith(mKey)) {
          if (r.type === 'expense') exp += r.amount;
          else inc += r.amount;
        }
      });
      months.push({ month: mKey, label, expense: exp, income: inc });
    }
    return months;
  }, [records, selectedMonth]);

  const maxHistoryValue = useMemo(() => {
    let max = 1000;
    historyData.forEach((h) => {
      if (h.expense > max) max = h.expense;
      if (h.income > max) max = h.income;
    });
    return max;
  }, [historyData]);

  // Donut chart path generation
  const donutPaths = useMemo(() => {
    if (stats.totalExpense === 0 || stats.categoryList.length === 0) return [];

    let accumulatedAngle = 0;
    const radius = 80;
    const innerRadius = 52;
    const cx = 100;
    const cy = 100;

    return stats.categoryList.map((cat) => {
      const angle = (cat.percentage / 100) * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;
      accumulatedAngle += angle;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const ix1 = cx + innerRadius * Math.cos(endRad);
      const iy1 = cy + innerRadius * Math.sin(endRad);
      const ix2 = cx + innerRadius * Math.cos(startRad);
      const iy2 = cy + innerRadius * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      const pathData = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
        L ${ix1} ${iy1}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}
        Z
      `;

      return {
        ...cat,
        pathData,
        startAngle,
        endAngle,
      };
    });
  }, [stats]);

  const handleSaveBudget = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateBudget(selectedMonth, Math.round(val));
    }
    setIsEditingBudget(false);
  };

  const handleExportMonthExcel = () => {
    confetti({
      particleCount: 35,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
    });
    exportExpensesToExcel(monthRecords, `生活開支報表_${selectedMonth}`);
  };

  const budgetProgress = currentBudget > 0 ? (stats.totalExpense / currentBudget) * 100 : 0;
  const budgetRemaining = currentBudget - stats.totalExpense;

  // Selected or hovered category details
  const activeDonutCategory = hoveredCategory
    ? stats.categoryList.find((c) => c.name === hoveredCategory)
    : stats.categoryList[0];

  // Monthly Spending Persona
  const persona = useMemo(() => {
    if (stats.totalExpense === 0) {
      return {
        title: '全新未開拓金庫 🌱',
        desc: '本月還沒有任何生活開支，小豬金庫飽滿無虞，這是一個嶄新的起點！',
        emoji: '🌱',
      };
    }
    const topCat = stats.categoryList[0];
    if (topCat) {
      if (topCat.name === '餐飲美食') {
        return {
          title: '美食探險家 🍜',
          desc: '生活可以簡單，唯有美食不能辜負！餐飲是您本月最大的幸福開銷。',
          emoji: '🍜',
        };
      }
      if (topCat.name === '休閒娛樂') {
        return {
          title: '生活樂活家 🎮',
          desc: '快樂回憶無價！懂得生活、適時放鬆犒賞自己。',
          emoji: '🎉',
        };
      }
      if (topCat.name === '日常購物') {
        return {
          title: '質感生活選物師 🛍️',
          desc: '買的不是東西，是專屬於你的精緻生活儀式感！',
          emoji: '🛍️',
        };
      }
      if (topCat.name === '交通出行') {
        return {
          title: '城市通勤冒險者 🚗',
          desc: '不是在路上，就是在出發的路上！為日常打拼行動力滿分。',
          emoji: '🚇',
        };
      }
      if (topCat.name === '進修學習') {
        return {
          title: '自我投資求知者 📚',
          desc: '投資大腦是永遠穩賺不賠的決定，小豬為您的努力喝采！',
          emoji: '📚',
        };
      }
    }
    if (stats.savingsRate >= 40) {
      return {
        title: '超級金庫守護神 👑',
        desc: '儲蓄率高達 40% 以上！超凡自律，邁向財務自由的最佳模範！',
        emoji: '👑',
      };
    }
    return {
      title: '踏實生活家 🏡',
      desc: '財務狀況穩健，每筆支出都認真踏實，繼續保持好習慣！',
      emoji: '🌟',
    };
  }, [stats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Month Selector Bar & Quick Export */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-colors cursor-pointer"
              title="前一個月"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-3 py-1 flex items-center gap-2 font-bold text-gray-900 text-base sm:text-lg">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>
                {selectedMonth.split('-')[0]} 年 {parseInt(selectedMonth.split('-')[1], 10)} 月
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-colors cursor-pointer"
              title="下一個月"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setBudgetInput((budgets[e.target.value] ?? 30000).toString());
            }}
            className="px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m.replace('-', '年')}月
              </option>
            ))}
          </select>
        </div>

        {/* Action Button: Export Current Month Excel */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMonthExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>匯出本月 Excel 報表</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Expense */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">本月總支出</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-rose-600">
              NT$ {stats.totalExpense.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">共 {monthRecords.filter((r) => r.type === 'expense').length} 筆消費支出</div>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">本月總收入</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              NT$ {stats.totalIncome.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">共 {monthRecords.filter((r) => r.type === 'income').length} 筆入帳</div>
          </div>
        </div>

        {/* Net Savings & Rate */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">本月結餘 (儲蓄率)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-xl sm:text-2xl font-black ${
                stats.netSavings >= 0 ? 'text-blue-600' : 'text-red-500'
              }`}
            >
              NT$ {stats.netSavings.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-gray-600 mt-1">
              儲蓄率：{stats.savingsRate >= 0 ? stats.savingsRate.toFixed(1) : 0}%
            </div>
          </div>
        </div>

        {/* Daily Average & Peak */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">每日平均支出</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-purple-700">
              NT$ {Math.round(stats.dailyAverage).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              單日最高：NT$ {stats.peakAmount.toLocaleString()} ({stats.peakDay.slice(-2)}日)
            </div>
          </div>
        </div>
      </div>

      {/* Budget Progress Bar Card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-gray-800">每月生活開支預算進度</h3>
            {isEditingBudget ? (
              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:border-emerald-500 font-bold"
                />
                <button
                  onClick={handleSaveBudget}
                  className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                  title="儲存預算"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingBudget(true)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="修改本月預算目標"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs font-semibold text-gray-600 flex items-center gap-3">
            <span>
              已使用：<strong className="text-rose-600">{budgetProgress.toFixed(1)}%</strong>
            </span>
            <span>
              設定預算：<strong>NT$ {currentBudget.toLocaleString()}</strong>
            </span>
            <span>
              剩餘額度：
              <strong className={budgetRemaining >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                NT$ {budgetRemaining.toLocaleString()}
              </strong>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              budgetProgress > 100
                ? 'bg-rose-500'
                : budgetProgress > 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(budgetProgress, 100)}%` }}
          />
        </div>
      </div>

      {/* Monthly Financial Persona Card */}
      <div className="bg-gradient-to-r from-amber-50/80 via-rose-50/50 to-purple-50/80 rounded-2xl p-4 sm:p-5 border border-amber-200/60 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-amber-200 flex items-center justify-center text-2xl shrink-0">
            {persona.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                本月消費人格診斷
              </span>
              <h4 className="text-sm sm:text-base font-black text-gray-900">{persona.title}</h4>
            </div>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{persona.desc}</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid: Donut Breakdown + Daily Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart: 類別消費佔比 */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-gray-900">消費類別分析</h3>
            </div>
            <span className="text-xs text-gray-400">點擊類別可篩選</span>
          </div>

          {stats.totalExpense === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <AlertCircle className="w-8 h-8 mb-2 stroke-1" />
              <p className="text-sm">本月尚無支出紀錄</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* SVG Donut */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {donutPaths.map((slice, i) => (
                    <path
                      key={i}
                      d={slice.pathData}
                      fill={slice.color}
                      className="transition-all duration-200 cursor-pointer hover:opacity-85"
                      style={{
                        transform: hoveredCategory === slice.name ? 'scale(1.04)' : 'scale(1)',
                        transformOrigin: '100px 100px',
                      }}
                      onMouseEnter={() => setHoveredCategory(slice.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={() => onSelectCategory && onSelectCategory(slice.name)}
                    />
                  ))}
                </svg>

                {/* Donut Center Info */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                  <span className="text-xs font-semibold text-gray-400 truncate max-w-[100px]">
                    {activeDonutCategory?.name || '總支出'}
                  </span>
                  <span className="text-lg sm:text-xl font-black text-gray-900">
                    NT$ {(activeDonutCategory?.total || stats.totalExpense).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {activeDonutCategory ? `${activeDonutCategory.percentage.toFixed(1)}%` : '100%'}
                  </span>
                </div>
              </div>

              {/* Category Legend List */}
              <div className="w-full mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
                {stats.categoryList.map((cat) => (
                  <div
                    key={cat.name}
                    onMouseEnter={() => setHoveredCategory(cat.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => onSelectCategory && onSelectCategory(cat.name)}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      hoveredCategory === cat.name
                        ? 'border-emerald-400 bg-emerald-50/50'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0">{cat.emoji}</span>
                      <span className="text-xs font-bold text-gray-800 truncate">{cat.name}</span>
                      <span className="text-xs text-gray-400">({cat.count}筆)</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-gray-900 mr-2">
                        NT$ {cat.total.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 inline-block w-10 text-right">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Daily Expense Trend Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-gray-900">本月每日消費走勢</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                <span>每日開銷</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 border-b-2 border-dashed border-gray-400" />
                <span>日均線</span>
              </div>
            </div>
          </div>

          {/* Daily Bar Chart View */}
          <div className="flex-1 flex flex-col justify-end pt-4 min-h-[220px]">
            {stats.totalExpense === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                目前本月份無任何消費數據
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-44 flex items-end gap-1 sm:gap-1.5 w-full overflow-x-auto pb-2 pt-4 px-1">
                  {Object.entries(stats.dailyExpenses).map(([dayKey, amount]) => {
                    const dayNum = parseInt(dayKey.slice(-2), 10);
                    const isPeak = amount === stats.peakAmount && amount > 0;
                    const heightPercent = stats.peakAmount > 0 ? (amount / stats.peakAmount) * 100 : 0;

                    return (
                      <div
                        key={dayKey}
                        className="flex-1 min-w-[12px] sm:min-w-[16px] flex flex-col items-center group relative h-full justify-end"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                          <div className="bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap">
                            {dayNum}日: NT$ {amount.toLocaleString()}
                          </div>
                          <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-0.5" />
                        </div>

                        {/* Bar */}
                        <div
                          className={`w-full rounded-t-sm transition-all duration-300 group-hover:brightness-90 ${
                            isPeak
                              ? 'bg-gradient-to-t from-rose-500 to-rose-400'
                              : amount > stats.dailyAverage
                              ? 'bg-rose-300'
                              : 'bg-emerald-200'
                          }`}
                          style={{
                            height: `${Math.max(heightPercent, amount > 0 ? 4 : 0)}%`,
                          }}
                        />

                        {/* Day label */}
                        <span className="text-[9px] text-gray-400 mt-1 font-mono">{dayNum}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 px-2 pt-1 border-t border-gray-100">
                  <span>1 日</span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    平均日開支 NT$ {Math.round(stats.dailyAverage).toLocaleString()}
                  </span>
                  <span>{stats.daysInMonth} 日</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical 6-Months Dual Bar Comparison & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 6-Month Comparison */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>近 6 個月收支趨勢對比</span>
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> 收入
              </span>
              <span className="flex items-center gap-1.5 font-medium text-rose-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> 支出
              </span>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-4 pt-6 px-2">
            {historyData.map((item) => {
              const expHeight = maxHistoryValue > 0 ? (item.expense / maxHistoryValue) * 100 : 0;
              const incHeight = maxHistoryValue > 0 ? (item.income / maxHistoryValue) * 100 : 0;
              const isSelected = item.month === selectedMonth;

              return (
                <div
                  key={item.month}
                  onClick={() => setSelectedMonth(item.month)}
                  className={`flex-1 flex flex-col items-center cursor-pointer group p-1 rounded-xl transition-colors ${
                    isSelected ? 'bg-emerald-50/60 ring-1 ring-emerald-300' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    {/* Income Bar */}
                    <div
                      className="w-1/2 max-w-[18px] bg-emerald-500 rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                      style={{ height: `${Math.max(incHeight, item.income > 0 ? 5 : 0)}%` }}
                      title={`${item.label} 收入: NT$ ${item.income.toLocaleString()}`}
                    />
                    {/* Expense Bar */}
                    <div
                      className="w-1/2 max-w-[18px] bg-rose-400 rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                      style={{ height: `${Math.max(expHeight, item.expense > 0 ? 5 : 0)}%` }}
                      title={`${item.label} 支出: NT$ ${item.expense.toLocaleString()}`}
                    />
                  </div>
                  <span
                    className={`text-xs mt-2 font-bold ${
                      isSelected ? 'text-emerald-700' : 'text-gray-600'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>支付方式分佈</span>
          </h3>

          <div className="flex-1 space-y-3.5 flex flex-col justify-center">
            {PAYMENT_METHODS.map((pm) => {
              const amount = stats.paymentTotals[pm.id] || 0;
              const percent = stats.totalExpense > 0 ? (amount / stats.totalExpense) * 100 : 0;

              return (
                <div key={pm.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                      <CategoryIcon name={pm.icon} className="w-3.5 h-3.5 text-gray-500" />
                      <span>{pm.name}</span>
                    </div>
                    <div className="text-gray-900 font-bold">
                      NT$ {amount.toLocaleString()} ({percent.toFixed(0)}%)
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%`, backgroundColor: pm.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Smart Financial Insights Card */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>智慧開支洞察與理財建議</span>
            </div>
            <h4 className="text-lg font-bold text-white">
              {stats.totalExpense === 0
                ? '本月尚未記錄足夠消費數據'
                : stats.categoryList[0]
                ? `本月最大的消費支出為「${stats.categoryList[0].name}」，佔總支出 ${stats.categoryList[0].percentage.toFixed(1)}%`
                : '每月消費分析健全'}
            </h4>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-2xl">
              {budgetRemaining >= 0
                ? `目前本月剩餘預算 NT$ ${budgetRemaining.toLocaleString()}，儲蓄率保持在 ${stats.savingsRate.toFixed(
                    1
                  )}%，整體財務狀況健康穩健！可持續透過 Google 試算表保持每天定期紀錄。`
                : `注意！本月生活開支已超出設定預算 NT$ ${Math.abs(budgetRemaining).toLocaleString()}，建議控制非必要娛樂與日常購物支出。`}
            </p>
          </div>

          <div className="flex shrink-0 gap-3">
            <button
              onClick={handleExportMonthExcel}
              className="px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-900 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>下載報表 (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
