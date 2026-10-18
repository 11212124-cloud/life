import { ExpenseRecord, PaymentMethod } from '../types/expense';
import { PAYMENT_METHODS, EXPENSE_MOODS } from '../constants/categories';

export const SHEET_HEADERS = [
  '紀錄編號 (ID)',
  '日期',
  '收支類型',
  '消費類別',
  '項目說明',
  '金額 (NT$)',
  '支付方式',
  '備註',
  '建立時間',
];

const getPaymentName = (method: PaymentMethod): string => {
  const found = PAYMENT_METHODS.find((p) => p.id === method);
  return found ? found.name : method;
};

const getPaymentId = (name: string): PaymentMethod => {
  const found = PAYMENT_METHODS.find((p) => p.name === name || p.id === name);
  return found ? found.id : 'cash';
};

const getNoteWithMood = (note?: string, mood?: string): string => {
  const foundMood = EXPENSE_MOODS.find((m) => m.id === mood);
  if (foundMood) {
    return note ? `[${foundMood.emoji} ${foundMood.label}] ${note}` : `[${foundMood.emoji} ${foundMood.label}]`;
  }
  return note || '';
};

/**
 * Creates a brand new Google Spreadsheet configured for expense tracking.
 */
export const createExpenseSpreadsheet = async (
  accessToken: string,
  title = '生活開支記帳本 (Expense Tracker)'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> => {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: '收支紀錄',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `建立 Google 試算表失敗 (${createRes.status})`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write header row and format it nicely
  const headerRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'收支紀錄'!A1:I1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: "'收支紀錄'!A1:I1",
        majorDimension: 'ROWS',
        values: [SHEET_HEADERS],
      }),
    }
  );

  if (!headerRes.ok) {
    console.warn('寫入試算表標頭失敗，但試算表已建立。');
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
};

/**
 * Checks spreadsheet validity and fetches title.
 */
export const getSpreadsheetInfo = async (
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: string[] }> => {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `無法讀取試算表資訊 (${res.status})`);
  }

  const data = await res.json();
  const title = data.properties?.title || '未命名試算表';
  const sheets = (data.sheets || []).map((s: any) => s.properties?.title as string);

  return { title, sheets };
};

/**
 * Appends a list of expense records to the active Google Spreadsheet.
 */
export const appendExpensesToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  records: ExpenseRecord[],
  sheetTabName = '收支紀錄'
): Promise<number> => {
  if (records.length === 0) return 0;

  const rows = records.map((r) => [
    r.id,
    r.date,
    r.type === 'expense' ? '支出' : '收入',
    r.category,
    r.title,
    r.amount,
    getPaymentName(r.paymentMethod),
    getNoteWithMood(r.note, r.mood),
    r.createdAt,
  ]);

  const targetRange = `'${sheetTabName}'!A:I`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetRange
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `上傳紀錄至 Google 試算表失敗 (${res.status})`);
  }

  return records.length;
};

/**
 * Overwrites / syncs full list of expenses to Google Sheets, including header.
 */
export const syncFullExpensesToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  records: ExpenseRecord[],
  sheetTabName = '收支紀錄'
): Promise<number> => {
  // First clear old data
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetTabName}'!A:I:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  ).catch((e) => console.warn('Clear sheet failed:', e));

  const allRows = [
    SHEET_HEADERS,
    ...records.map((r) => [
      r.id,
      r.date,
      r.type === 'expense' ? '支出' : '收入',
      r.category,
      r.title,
      r.amount,
      getPaymentName(r.paymentMethod),
      getNoteWithMood(r.note, r.mood),
      r.createdAt,
    ]),
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetTabName}'!A1:I${allRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'${sheetTabName}'!A1:I${allRows.length}`,
        majorDimension: 'ROWS',
        values: allRows,
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `完整同步至 Google 試算表失敗 (${res.status})`);
  }

  return records.length;
};

/**
 * Loads records from Google Sheets into local expense records.
 */
export const loadExpensesFromSheet = async (
  accessToken: string,
  spreadsheetId: string,
  sheetTabName = '收支紀錄'
): Promise<ExpenseRecord[]> => {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetTabName}'!A2:I`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `從 Google 試算表下載失敗 (${res.status})`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  const loadedRecords: ExpenseRecord[] = [];

  for (const row of rows) {
    if (!row || row.length < 5) continue;
    const [id, date, typeStr, category, title, amountStr, paymentStr, note, createdAt] = row;
    const amount = parseFloat(amountStr) || 0;
    const type = typeStr === '收入' ? 'income' : 'expense';
    const paymentMethod = getPaymentId(paymentStr || 'cash');

    loadedRecords.push({
      id: id || `sheet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: date || new Date().toISOString().split('T')[0],
      type,
      category: category || (type === 'income' ? '薪資收入' : '餐飲美食'),
      title: title || '未命名項目',
      amount,
      paymentMethod,
      note: note || '',
      syncedToSheets: true,
      createdAt: createdAt || new Date().toISOString(),
    });
  }

  return loadedRecords;
};
