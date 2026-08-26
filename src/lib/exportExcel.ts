import * as XLSX from 'xlsx';
import { CompletedCheck } from '@/components/ChecklistRunner';

export const exportChecksToExcel = (checks: CompletedCheck[], fileName = 'Проверки') => {
  const rows = checks.map((c) => ({
    'Дата': c.time,
    'Период': c.month,
    'Ресторан': c.restaurant,
    'Зона': c.zone,
    'Чек-лист': c.title,
    'Проверяющий': c.by,
    'Официант': c.waiter ?? '',
    'Балл': c.score,
    'Зачётов': c.okCount ?? '',
    'Всего пунктов': c.totalCount ?? '',
    'Незачётов': c.issues,
    'Депремирование, ₽': c.fine ?? 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 28 },
    { wch: 20 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 14 },
    { wch: 10 }, { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Проверки');

  const today = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
  XLSX.writeFile(workbook, `${fileName} ${today}.xlsx`);
};
