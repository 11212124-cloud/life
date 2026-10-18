import * as XLSX from 'xlsx';
import { ExpenseRecord, PaymentMethod } from '../types/expense';
import { PAYMENT_METHODS } from '../constants/categories';

const getPaymentName = (method: PaymentMethod): string => {
  const found = PAYMENT_METHODS.find((p) => p.id === method);
  return found ? found.name : method;
};

export const exportExpensesToExcel = (
  records: ExpenseRecord[],
  fileNamePrefix = '生活開支記帳報表'
) => {
  if (records.length === 0) {
    throw new Error('目前沒有任何記帳資料可匯出！');
  }

  // Sort by date descending
  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

  // --- Sheet 1: 收支明細表 ---
  const detailRows = sortedRecords.map((r) => ({
    '紀錄編號': r.id,
    '日期': r.date,
    '收支類型': r.type === 'expense' ? '支出' : '收入',
    '消費類別': r.category,
    '項目描述': r.title,
    '金額 (NT$)': r.amount,
    '支付方式': getPaymentName(r.paymentMethod),
    '備註說明': r.note || '',
    '建立時間': new Date(r.createdAt).toLocaleString('zh-TW', { hour12: false }),
  }));

  const detailWs = XLSX.utils.json_to_sheet(detailRows);
  // Set column widths
  detailWs['!cols'] = [
    { wch: 18 }, // ID
    { wch: 12 }, // 日期
    { wch: 10 }, // 類型
    { wch: 14 }, // 類別
    { wch: 22 }, // 項目
    { wch: 12 }, // 金額
    { wch: 16 }, // 支付方式
    { wch: 25 }, // 備註
    { wch: 20 }, // 建立時間
  ];

  // --- Sheet 2: 每月收支彙總 ---
  const monthlyStats: Record<string, { expense: number; income: number; count: number }> = {};
  sortedRecords.forEach((r) => {
    const month = r.date.substring(0, 7); // YYYY-MM
    if (!monthlyStats[month]) {
      monthlyStats[month] = { expense: 0, income: 0, count: 0 };
    }
    if (r.type === 'expense') {
      monthlyStats[month].expense += r.amount;
    } else {
      monthlyStats[month].income += r.amount;
    }
    monthlyStats[month].count += 1;
  });

  const monthRows = Object.entries(monthlyStats)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, stats]) => {
      const net = stats.income - stats.expense;
      const savingsRate = stats.income > 0 ? ((net / stats.income) * 100).toFixed(1) + '%' : '-';
      return {
        '統計月份': month,
        '總收入 (NT$)': stats.income,
        '總支出 (NT$)': stats.expense,
        '淨結餘 (NT$)': net,
        '儲蓄率': savingsRate,
        '交易總筆數': stats.count,
      };
    });

  const monthWs = XLSX.utils.json_to_sheet(monthRows);
  monthWs['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
  ];

  // --- Sheet 3: 類別消費統計 ---
  const categoryStats: Record<string, { total: number; count: number }> = {};
  let totalExpenseAll = 0;

  sortedRecords
    .filter((r) => r.type === 'expense')
    .forEach((r) => {
      totalExpenseAll += r.amount;
      if (!categoryStats[r.category]) {
        categoryStats[r.category] = { total: 0, count: 0 };
      }
      categoryStats[r.category].total += r.amount;
      categoryStats[r.category].count += 1;
    });

  const categoryRows = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([category, stats]) => ({
      '消費類別': category,
      '總金額 (NT$)': stats.total,
      '消費筆數': stats.count,
      '佔比 (%)': totalExpenseAll > 0 ? ((stats.total / totalExpenseAll) * 100).toFixed(1) + '%' : '0%',
    }));

  const categoryWs = XLSX.utils.json_to_sheet(categoryRows);
  categoryWs['!cols'] = [
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
  ];

  // Create workbook and append sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, detailWs, '收支明細');
  XLSX.utils.book_append_sheet(wb, monthWs, '每月彙總報告');
  XLSX.utils.book_append_sheet(wb, categoryWs, '類別消費佔比');

  const nowStr = new Date().toISOString().split('T')[0];
  const finalFilename = `${fileNamePrefix}_${nowStr}.xlsx`;

  XLSX.writeFile(wb, finalFilename);
};
