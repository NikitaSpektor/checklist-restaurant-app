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

export interface DishCriteriaScores {
  appearance: number | null;
  cleanliness: number | null;
  temperature: number | null;
  organoleptic: number | null;
}

export const emptyDishScores = (): DishCriteriaScores => ({
  appearance: null, cleanliness: null, temperature: null, organoleptic: null,
});

export const DISH_CRITERIA: { key: keyof DishCriteriaScores; label: string; hint: string }[] = [
  { key: 'appearance', label: 'Внешний вид', hint: 'подача, декор, расположение' },
  { key: 'cleanliness', label: 'Чистота и запах посуды', hint: '' },
  { key: 'temperature', label: 'Температура подачи', hint: 'посуда и продукт' },
  { key: 'organoleptic', label: 'Органолептика', hint: 'свежесть продукта, качество приготовления' },
];

export interface DishRow {
  id: number;
  name: string;
  orderTime: string;
  serveTime: string;
  /** @deprecated используйте scores */
  appearanceOk?: boolean | null;
  scores?: DishCriteriaScores;
  comment: string;
  photos: string[];
}

export const emptyDishRow = (id: number): DishRow => ({
  id, name: '', orderTime: '', serveTime: '', scores: emptyDishScores(), comment: '', photos: [],
});

/** Оценки, которые реально проставлены по блюду (без пустых критериев) */
export const dishFilledScores = (d: DishRow): number[] =>
  d.scores ? Object.values(d.scores).filter((v): v is number => v != null) : [];

/** Средний балл блюда по заполненным критериям; для старых записей — фолбэк на appearanceOk */
export const dishAverageScore = (d: DishRow): number | null => {
  const vals = dishFilledScores(d);
  if (vals.length) return vals.reduce((a, b) => a + b, 0) / vals.length;
  if (d.appearanceOk === true) return 5;
  if (d.appearanceOk === false) return 2;
  return null;
};

/** Блюдо считается замечанием, если хотя бы один критерий оценён на 1-2 балла */
export const dishHasIssue = (d: DishRow): boolean => {
  const vals = dishFilledScores(d);
  if (vals.length) return vals.some((v) => v <= 2);
  return d.appearanceOk === false;
};

/** Средний балл по ВСЕМ выставленным оценкам всех блюд листа */
export const tastingOverallAverage = (dishes: DishRow[]): number | null => {
  const allScores = dishes.flatMap((d) => dishFilledScores(d));
  if (!allScores.length) return null;
  return allScores.reduce((a, b) => a + b, 0) / allScores.length;
};

export const calcPrepMinutes = (orderTime: string, serveTime: string): number | null => {
  if (!orderTime || !serveTime) return null;
  const [oh, om] = orderTime.split(':').map(Number);
  const [sh, sm] = serveTime.split(':').map(Number);
  if ([oh, om, sh, sm].some((n) => Number.isNaN(n))) return null;
  let diff = (sh * 60 + sm) - (oh * 60 + om);
  if (diff < 0) diff += 24 * 60;
  return diff;
};

export const monthYearFromDate = (dateStr?: string): string => {
  if (!dateStr) return `${currentMonth} ${currentYear}`;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return `${currentMonth} ${currentYear}`;
  const [y, m] = parts;
  const idx = Number(m) - 1;
  if (idx < 0 || idx > 11 || Number.isNaN(Number(y))) return `${currentMonth} ${currentYear}`;
  return `${MONTHS[idx]} ${y}`;
};

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
  kind?: 'checklist' | 'tasting';
  seatingPercent?: number;
  checkDate?: string;
  dishes?: DishRow[];
  otherComments?: string;
  participants?: string;
  receiptPhotos?: string[];
  /** В списке (GET без id) тяжёлые поля не приходят — сервер сообщает лишь факт наличия истории */
  hasEditHistory?: boolean;
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
  'toktogoraev@iconfood.ru', 'korovkin@iconfood.ru', 'chekov@iconfood.ru',
  'deryabin@iconfood.ru', 'palchevskaya@iconfood.ru', 'anisimov@iconfood.ru',
  'molodkin@iconfood.ru', 'r.litvinov@iconfood.ru', 'shigaeva@iconfood.ru',
  'anikina@iconfood.ru', 'osipov@iconfood.ru', 'filik@iconfood.ru',
  'shevchenko@iconfood.ru',
];

export const SEND_URL = 'https://functions.poehali.dev/faabce4f-655f-4f86-b4fc-2d9027ac511c';
export const UPLOAD_URL = 'https://functions.poehali.dev/28ba2203-7a14-4242-9412-4c6aff414ec8';

export interface DraftData {
  lastName: string;
  firstName: string;
  month: string;
  year: number;
  restaurant: string;
  waiterName: string;
  started: boolean;
  states: Record<number, ItemState>;
  finesDistribution: string;
  savedAt: number;
}

const DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000; // черновик актуален 14 дней

export const getDraftKey = (zone: string, title: string, editingId?: number) =>
  `checklist_draft::${zone}::${title}::${editingId ?? 'new'}`;

export const loadDraft = (key: string): DraftData | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as DraftData;
    if (!draft.savedAt || Date.now() - draft.savedAt > DRAFT_TTL_MS) return null;
    return draft;
  } catch {
    return null;
  }
};

export const saveDraft = (key: string, draft: Omit<DraftData, 'savedAt'>) => {
  try {
    localStorage.setItem(key, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch { /* хранилище переполнено — пропускаем сохранение черновика */ }
};

export const clearDraft = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch { /* ignore */ }
};