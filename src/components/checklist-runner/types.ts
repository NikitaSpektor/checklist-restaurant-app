export interface ChecklistItem {
  id: number;
  text: string;
  section?: string;
  fine?: number;
  hasNa?: boolean;
}

export interface RunnerData {
  title: string;
  zone: string;
  items: ChecklistItem[];
}

export interface CompletedCheckItem {
  id: number;
  text: string;
  section?: string;
  fine?: number;
  status: 'pending' | 'ok' | 'issue' | 'issue_no_fine' | 'na';
  comment: string;
  /** @deprecated используйте photos */
  photo?: string;
  photos?: string[];
}

export interface EditHistoryEntry {
  by: string;
  time: string;
}

export interface CompletedCheck {
  id: number;
  title: string;
  zone: string;
  score: number;
  by: string;
  waiter?: string;
  restaurant: string;
  month: string;
  time: string;
  issues: number;
  fine?: number;
  okCount?: number;
  totalCount?: number;
  itemsDetail?: CompletedCheckItem[];
  finesDistribution?: string;
  editHistory?: EditHistoryEntry[];
}

export type Status = 'pending' | 'ok' | 'issue' | 'issue_no_fine' | 'na';

// Депремирование за незачёт по секции (только для зоны Стандарты)
export const FINE_BY_SECTION: Record<string, number> = {
  'Касса · 1000 баллов за каждый пункт': 1000,
  'Укомплектованность штата · 3000 баллов': 3000,
};
export const DEFAULT_FINE = 500;

export const getFine = (section: string | undefined): number => {
  if (!section) return DEFAULT_FINE;
  return FINE_BY_SECTION[section] ?? DEFAULT_FINE;
};

export interface ItemState {
  status: Status;
  comment: string;
  photos: string[];
}

export const RESTAURANTS = [
  'UDC Химки',
  'UDC Авиапарк',
  'UDC Кунцево Плаза',
  'UDC Проспект Мира',
  'UDC Павелецкая',
  'UDC Каширская Плаза',
  'UDC Саларис',
  'UDC Океания',
  'UDC Мега ТС',
  'UDC Метрополис',
  'UDC Капитолий',
  'UDC Афимолл',
  'Black Market',
];

export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export const currentMonth = MONTHS[new Date().getMonth()];
export const currentYear = new Date().getFullYear();
export const YEARS = [currentYear - 1, currentYear, currentYear + 1];

export const parseMonthYear = (monthStr?: string): { month: string; year: number } => {
  if (!monthStr) return { month: currentMonth, year: currentYear };
  const parts = monthStr.trim().split(' ');
  const yearNum = Number(parts[1]);
  if (parts.length === 2 && MONTHS.includes(parts[0]) && !Number.isNaN(yearNum)) {
    return { month: parts[0], year: yearNum };
  }
  return { month: currentMonth, year: currentYear };
};

export const parseAssignee = (by?: string): { lastName: string; firstName: string } => {
  if (!by) return { lastName: '', firstName: '' };
  const parts = by.trim().split(' ');
  return { lastName: parts[0] ?? '', firstName: parts.slice(1).join(' ') };
};

export const ALL_RECIPIENTS = [
  'spektor@iconfood.ru', 'sysoev@iconfood.ru', 'gavrilova@iconfood.ru',
  'e.metla@iconfood.ru', 'anufriev@iconfood.ru', 'genkin@iconfood.ru',
  'larionov@iconfood.ru', 'gukasyan@iconfood.ru', 'kopichuk@iconfood.ru',
  'kashnikov@iconfood.ru', 'garaeva@iconfood.ru', 'lipatov@iconfood.ru',
  'lysenko@iconfood.ru', 'sidanov@iconfood.ru', 'maslova@iconfood.ru',
  'bozhkova@iconfood.ru', 'akramova@iconfood.ru', 'chernyshev@iconfood.ru',
  'dvoeglazov@blackmarketcafe.ru', 'semyonova@iconfood.ru', 'd.solovyova@iconfood.ru',
  'petrakova@iconfood.ru', 'shuvalova@iconfood.ru', 'tarasenko@iconfood.ru',
];

export const SEND_URL = 'https://functions.poehali.dev/faabce4f-655f-4f86-b4fc-2d9027ac511c';
export const UPLOAD_URL = 'https://functions.poehali.dev/28ba2203-7a14-4242-9412-4c6aff414ec8';
