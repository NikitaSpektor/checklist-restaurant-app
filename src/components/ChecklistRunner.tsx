import { useRef, useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export interface ChecklistItem {
  id: number;
  text: string;
  section?: string;
  fine?: number;
}

export interface RunnerData {
  title: string;
  zone: string;
  items: ChecklistItem[];
}

export interface CompletedCheck {
  id: number;
  title: string;
  zone: string;
  score: number;
  by: string;
  restaurant: string;
  month: string;
  time: string;
  issues: number;
  fine?: number;
}

type Status = 'pending' | 'ok' | 'issue' | 'na';

// Штраф за незачёт по секции (только для зоны Стандарты)
const FINE_BY_SECTION: Record<string, number> = {
  'Касса · 1000 баллов за каждый пункт': 1000,
  'Укомплектованность штата · 3000 баллов': 3000,
};
const DEFAULT_FINE = 500;

const getFine = (section: string | undefined): number => {
  if (!section) return DEFAULT_FINE;
  return FINE_BY_SECTION[section] ?? DEFAULT_FINE;
};

interface ItemState {
  status: Status;
  comment: string;
  photo?: string;
}

const RESTAURANTS = [
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

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const currentMonth = MONTHS[new Date().getMonth()];
const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

const ChecklistRunner = ({ data, onClose, onComplete }: { data: RunnerData; onClose: () => void; onComplete?: (c: CompletedCheck) => void }) => {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [restaurant, setRestaurant] = useState('');
  const [started, setStarted] = useState(false);
  const [states, setStates] = useState<Record<number, ItemState>>(
    Object.fromEntries(data.items.map((i) => [i.id, { status: 'pending', comment: '' }]))
  );
  const finalAssignee = `${lastName} ${firstName}`.trim();
  const canStart = lastName.trim() && firstName.trim() && restaurant;
  const [finished, setFinished] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const SEND_URL = 'https://functions.poehali.dev/faabce4f-655f-4f86-b4fc-2d9027ac511c';

  const ALL_RECIPIENTS = [
    'spektor@iconfood.ru', 'sysoev@iconfood.ru', 'gavrilova@iconfood.ru',
    'e.metla@iconfood.ru', 'anufriev@iconfood.ru', 'genkin@iconfood.ru',
    'larionov@iconfood.ru', 'gukasyan@iconfood.ru', 'kopichuk@iconfood.ru',
    'kashnikov@iconfood.ru', 'garaeva@iconfood.ru', 'lipatov@iconfood.ru',
    'lysenko@iconfood.ru', 'sidanov@iconfood.ru', 'maslova@iconfood.ru',
    'bozhkova@iconfood.ru', 'akramova@iconfood.ru', 'chernyshev@iconfood.ru',
    'dvoeglazov@blackmarketcafe.ru', 'semyonova@iconfood.ru', 'd.solovyova@iconfood.ru',
  ];

  const toggleRecipient = useCallback((email: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  }, []);


  const set = (id: number, patch: Partial<ItemState>) =>
    setStates((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const checked = data.items.filter((i) => states[i.id].status !== 'pending').length;
  const okCount = data.items.filter((i) => states[i.id].status === 'ok').length;
  const issues = data.items.filter((i) => states[i.id].status === 'issue').length;
  const isStandards = data.zone === 'Стандарты';
  const scorePrecision = isStandards ? 2 : 1;
  const score = data.items.length
    ? Math.max(1, parseFloat((5 - (issues / data.items.length) * 4).toFixed(scorePrecision)))
    : 5;
  const isKitchen = data.zone === 'Кухня';
  const isPastry = data.zone === 'Кондитер';
  const isBar = data.zone === 'Бар';
  const hasFines = isStandards || isKitchen || isPastry || isBar;
  const totalFine = hasFines
    ? data.items
        .filter((i) => states[i.id].status === 'issue')
        .reduce((sum, i) => sum + (i.fine ?? (isStandards ? getFine(i.section) : 0)), 0)
    : 0;

  const onFile = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set(id, { photo: reader.result as string });
    reader.readAsDataURL(file);
  };

  // Экран заполнения данных перед проверкой
  if (!started) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
        <header className="border-b border-border/60 shrink-0">
          <div className="max-w-lg mx-auto px-5 sm:px-8 h-16 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={onClose}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <div>
              <p className="font-semibold text-sm tracking-tight">{data.title}</p>
              <p className="text-[11px] text-muted-foreground">Данные проверки</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-5 sm:px-8 py-8">
            <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight mb-2">Перед началом<br/>проверки</h2>
            <p className="text-muted-foreground text-sm mb-8">Заполните данные — они войдут в итоговый отчёт</p>

            <div className="space-y-5">
              {/* Проверяющий */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Проверяющий</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Фамилия</label>
                    <Input
                      placeholder="Соколов"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="rounded-2xl h-12"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Имя</label>
                    <Input
                      placeholder="Алексей"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="rounded-2xl h-12"
                    />
                  </div>
                </div>
              </div>

              {/* Период */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Период</p>
                <div>
                  <label className="text-sm font-medium">Год</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {YEARS.map((y) => (
                      <button
                        key={y}
                        onClick={() => setYear(y)}
                        className={`h-10 rounded-xl text-sm font-medium transition-all ${
                          year === y
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Месяц проверки</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {MONTHS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMonth(m)}
                        className={`h-10 rounded-xl text-sm font-medium transition-all ${
                          month === m
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ресторан */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Место проведения</p>
                <label className="text-sm font-medium">Ресторан</label>
                <div className="space-y-2 mt-2">
                  {RESTAURANTS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRestaurant(r)}
                      className={`w-full flex items-center justify-between gap-3 px-4 h-12 rounded-2xl border text-sm font-medium transition-all text-left ${
                        restaurant === r
                          ? 'border-primary bg-accent text-accent-foreground'
                          : 'border-border/70 bg-card hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="MapPin" size={16} className="text-muted-foreground shrink-0" />
                        {r}
                      </div>
                      {restaurant === r && <Icon name="Check" size={16} className="text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="border-t border-border/60 shrink-0">
          <div className="max-w-lg mx-auto px-5 sm:px-8 py-4 space-y-2">
            {canStart && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground px-1 animate-fade-in">
                <span className="flex items-center gap-1.5"><Icon name="User" size={13} />{finalAssignee}</span>
                <span className="flex items-center gap-1.5"><Icon name="CalendarDays" size={13} />{month} {year}</span>
                <span className="flex items-center gap-1.5"><Icon name="MapPin" size={13} />{restaurant}</span>
              </div>
            )}
            <Button
              disabled={!canStart}
              onClick={() => setStarted(true)}
              className="w-full rounded-full h-12 gap-2 text-base"
            >
              Начать проверку
              <Icon name="ArrowRight" size={18} />
            </Button>
          </div>
        </footer>
      </div>
    );
  }

  if (finished) {
    const issueItems = data.items.filter((i) => states[i.id].status === 'issue');
    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

    const sendReport = async () => {
      setSendStatus('sending');
      try {
        const report = {
          title: data.title,
          zone: data.zone,
          restaurant,
          month: `${month} ${year}`,
          time: now.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
          by: finalAssignee,
          score,
          ok_count: okCount,
          issues_count: issues,
          total: data.items.length,
          fine: hasFines ? totalFine : null,
          items: data.items.map((item) => ({ text: item.text, status: states[item.id].status })),
          issues: issueItems.map((item) => ({ text: item.text, comment: states[item.id].comment || '' })),
        };
        const res = await fetch(SEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipients: selectedRecipients, report }),
        });
        if (res.ok) { setSendStatus('ok'); setEmailOpen(false); }
        else setSendStatus('error');
      } catch {
        setSendStatus('error');
      }
    };

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
        {/* Шапка */}
        <header className="border-b border-border/60 bg-background shrink-0 print:hidden">
          <div className="max-w-2xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
            <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={onClose}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <p className="font-semibold text-sm">Отчёт сформирован</p>
            <Button className="rounded-full gap-2 h-9 px-4" onClick={() => window.print()}>
              <Icon name="Download" size={15} />
              Сохранить PDF
            </Button>
          </div>
        </header>

        {/* Отчёт */}
        <div className="flex-1 overflow-y-auto">
          <div id="print-report" className="max-w-2xl mx-auto px-5 sm:px-8 py-8 space-y-6">

            {/* Логотип + заголовок */}
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <img
                  src="https://cdn.poehali.dev/projects/da861bac-1ea4-49ae-b39c-72c9841ade32/bucket/0587e8cf-1680-4a82-baf6-adff85516944.png"
                  alt="ICONFOOD"
                  className="h-6 sm:h-7 w-auto object-contain mb-2 sm:mb-3"
                />
                <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight">{data.title}</h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">{restaurant} · {month} {year} · {dateStr}</p>
              </div>
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0 flex flex-col items-center justify-center font-semibold tabular-nums ${
                score >= 4 ? 'bg-accent text-accent-foreground' : score >= 3 ? 'bg-secondary text-secondary-foreground' : 'bg-destructive/10 text-destructive'
              }`}>
                <span className="text-xl sm:text-2xl leading-none">{score}</span>
                <span className="text-[10px] sm:text-[11px] font-normal mt-0.5 opacity-70">из 5</span>
              </div>
            </div>

            {/* Мета-строка */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { icon: 'User', label: 'Проверяющий', value: finalAssignee },
                { icon: 'CheckCheck', label: 'Зачёт', value: `${okCount} из ${data.items.length}` },
                { icon: 'X', label: 'Незачёт', value: String(issues) },
              ].map((m) => (
                <div key={m.label} className="bg-secondary/50 rounded-2xl p-3 sm:p-4">
                  <Icon name={m.icon} size={16} className="text-muted-foreground mb-2" />
                  <p className="text-sm sm:text-lg font-semibold tabular-nums leading-tight">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Все пункты */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Все пункты проверки</p>
              <div className="border border-border/70 rounded-2xl overflow-hidden">
                {data.items.map((item, idx) => {
                  const st = states[item.id];
                  const prevSec = idx > 0 ? data.items[idx - 1].section : null;
                  const showSec = item.section && item.section !== prevSec;
                  return (
                    <div key={item.id}>
                      {showSec && (
                        <div className="px-4 py-2 bg-secondary/40 border-b border-border/50">
                          <span className="text-xs font-semibold uppercase tracking-widest text-primary">{item.section}</span>
                        </div>
                      )}
                    <div
                      className={`flex items-start gap-3 px-4 py-3 text-sm ${idx !== data.items.length - 1 ? 'border-b border-border/50' : ''} ${
                        st.status === 'issue' ? 'bg-destructive/5' : ''
                      }`}
                    >
                      <span className="text-muted-foreground tabular-nums w-5 shrink-0 pt-0.5">{idx + 1}</span>
                      <span className="flex-1 leading-snug">{item.text}</span>
                      <span className={`shrink-0 font-medium text-xs px-2 py-0.5 rounded-full ${
                        st.status === 'ok'
                          ? 'bg-primary/10 text-primary'
                          : st.status === 'issue'
                          ? 'bg-destructive/15 text-destructive'
                          : st.status === 'na'
                          ? 'bg-border/60 text-muted-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}>
                        {st.status === 'ok' ? 'Зачёт' : st.status === 'issue' ? 'Незачёт' : st.status === 'na' ? 'Неакт.' : '—'}
                      </span>
                    </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Незачёты с комментариями и фото — сгруппированы по секциям */}
            {issueItems.length > 0 && (() => {
              // Группируем по секции
              const grouped: { section: string; items: typeof issueItems }[] = [];
              issueItems.forEach((item) => {
                const sec = item.section ?? 'Без секции';
                const existing = grouped.find((g) => g.section === sec);
                if (existing) existing.items.push(item);
                else grouped.push({ section: sec, items: [item] });
              });
              let globalIdx = 0;
              return (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Незачёты · комментарии и фото</p>
                  <div className="space-y-5">
                    {grouped.map((group) => (
                      <div key={group.section}>
                        {group.section !== 'Без секции' && (
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-widest text-primary">{group.section}</span>
                            <div className="flex-1 h-px bg-primary/20" />
                          </div>
                        )}
                        <div className="space-y-3">
                          {group.items.map((item) => {
                            const st = states[item.id];
                            globalIdx += 1;
                            const num = globalIdx;
                            return (
                              <div key={item.id} className="border border-destructive/25 rounded-2xl p-4 space-y-3">
                                <div className="flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-full bg-destructive/15 text-destructive flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                                    {num}
                                  </span>
                                  <p className="text-sm font-medium leading-snug">{item.text}</p>
                                </div>
                                {st.comment && (
                                  <p className="text-sm text-muted-foreground pl-7 italic">«{st.comment}»</p>
                                )}
                                {st.photo && (
                                  <div className="pl-7">
                                    <img src={st.photo} alt="фото нарушения" className="h-40 w-auto rounded-xl object-cover" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Итоговый штраф */}
            {hasFines && (
              <div className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${totalFine > 0 ? 'bg-destructive/8 border border-destructive/25' : 'bg-secondary/50 border border-border/60'}`}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Итоговый штраф</p>
                  {isStandards && <p className="text-xs text-muted-foreground">Касса: −1 000 ₽/пункт · Укомплектованность: −3 000 ₽ · Остальные: −500 ₽/пункт</p>}
                  {isKitchen && <p className="text-xs text-muted-foreground">Штраф зависит от пункта: 500 / 1 000 / 3 000 / 5 000 ₽</p>}
                  {isPastry && <p className="text-xs text-muted-foreground">Штраф зависит от пункта: 500 или 1 000 ₽</p>}
                  {isBar && <p className="text-xs text-muted-foreground">Штраф зависит от пункта: 300 / 600 / 1 000 ₽</p>}
                </div>
                <p className={`text-2xl font-bold tabular-nums ${totalFine > 0 ? 'text-destructive' : 'text-primary'}`}>
                  {totalFine > 0 ? `−${totalFine.toLocaleString('ru-RU')} ₽` : '0 ₽'}
                </p>
              </div>
            )}

            {/* Подпись */}
            <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-muted-foreground">
              <span>Ресторанный холдинг ICONFOOD</span>
              <span>{dateStr}</span>
            </div>
          </div>
        </div>

        {/* Панель выбора получателей */}
        {emailOpen && (
          <div className="border-t border-border/60 bg-secondary/30 print:hidden">
            <div className="max-w-2xl mx-auto px-4 sm:px-8 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Выберите получателей</p>
                <button onClick={() => setEmailOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <Icon name="X" size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                {ALL_RECIPIENTS.map((email) => (
                  <button
                    key={email}
                    onClick={() => toggleRecipient(email)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-all ${
                      selectedRecipients.includes(email)
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'bg-card border border-border/60 text-foreground hover:border-primary/30'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                      selectedRecipients.includes(email) ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {selectedRecipients.includes(email) && <Icon name="Check" size={10} className="text-primary-foreground" />}
                    </div>
                    <span className="truncate">{email.split('@')[0]}</span>
                    <span className="text-muted-foreground text-xs truncate">@{email.split('@')[1]}</span>
                  </button>
                ))}
              </div>
              {sendStatus === 'error' && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <Icon name="CircleAlert" size={13} /> Ошибка отправки. Проверьте настройки почты.
                </p>
              )}
              {sendStatus === 'ok' && (
                <p className="text-xs text-primary flex items-center gap-1.5">
                  <Icon name="CircleCheck" size={13} /> Отчёт отправлен на {selectedRecipients.length} адрес{selectedRecipients.length === 1 ? '' : 'а'}!
                </p>
              )}
              <Button
                className="w-full rounded-full h-10 gap-2"
                disabled={selectedRecipients.length === 0 || sendStatus === 'sending'}
                onClick={sendReport}
              >
                {sendStatus === 'sending'
                  ? <><Icon name="Loader" size={15} className="animate-spin" /> Отправляем…</>
                  : <><Icon name="Send" size={15} /> Отправить {selectedRecipients.length > 0 ? `(${selectedRecipients.length})` : ''}</>
                }
              </Button>
            </div>
          </div>
        )}

        {/* Футер */}
        <footer className="border-t border-border/60 bg-background shrink-0 print:hidden">
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-4 flex gap-3">
            <Button variant="outline" className="flex-1 rounded-full h-11" onClick={onClose}>
              Закрыть
            </Button>
            <Button variant="outline" className="flex-1 rounded-full h-11 gap-2" onClick={() => { setEmailOpen((v) => !v); setSendStatus('idle'); }}>
              <Icon name="Mail" size={16} />
              На email
            </Button>
            <Button className="flex-1 rounded-full h-11 gap-2" onClick={() => window.print()}>
              <Icon name="FileDown" size={16} />
              PDF
            </Button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl shrink-0">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={onClose}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <div className="flex-1 text-center min-w-0">
            <p className="font-semibold text-sm tracking-tight truncate">{data.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">{finalAssignee} · {month} {year} · {restaurant}</p>
          </div>
          <span className="text-sm font-medium tabular-nums text-muted-foreground w-12 text-right">
            {checked}/{data.items.length}
          </span>
        </div>
        <div className="max-w-2xl mx-auto px-5 sm:px-8 pb-3">
          <Progress value={(checked / data.items.length) * 100} className="h-1.5" />
        </div>
      </header>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-6 space-y-3">
          {data.items.map((item, idx) => {
            const st = states[item.id];
            const prevSection = idx > 0 ? data.items[idx - 1].section : null;
            const showSection = item.section && item.section !== prevSection;
            return (
              <div key={item.id}>
                {showSection && (
                  <div className="flex items-center gap-3 pt-2 pb-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">{item.section}</span>
                    <div className="flex-1 h-px bg-primary/20" />
                  </div>
                )}
              <div
                className={`bg-card border rounded-3xl p-4 sm:p-5 transition-all ${
                  st.status === 'ok' ? 'border-primary/30' : st.status === 'issue' ? 'border-destructive/40' : st.status === 'na' ? 'border-border/40 opacity-50' : 'border-border/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-muted-foreground tabular-nums mt-1.5 w-5 shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium leading-snug ${st.status === 'na' ? 'line-through text-muted-foreground' : ''}`}>{item.text}</p>
                    {hasFines && item.fine && (
                      <span className="inline-block mt-1 text-[11px] font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                        незачёт: −{item.fine.toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3 sm:mt-4 pl-6 sm:pl-8">
                  <button
                    onClick={() => set(item.id, { status: st.status === 'ok' ? 'pending' : 'ok' })}
                    className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all ${
                      st.status === 'ok' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                    }`}
                  >
                    <Icon name="Check" size={16} /> Зачёт
                  </button>
                  <button
                    onClick={() => set(item.id, { status: st.status === 'issue' ? 'pending' : 'issue' })}
                    className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all ${
                      st.status === 'issue' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                    }`}
                  >
                    <Icon name="X" size={16} /> Незачёт
                  </button>
                  {isStandards && (
                    <button
                      onClick={() => set(item.id, { status: st.status === 'na' ? 'pending' : 'na', comment: '', photo: undefined })}
                      className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all min-w-[110px] ${
                        st.status === 'na' ? 'bg-muted-foreground/20 text-muted-foreground ring-1 ring-border' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                      }`}
                    >
                      <Icon name="Minus" size={16} /> Неактуально
                    </button>
                  )}
                </div>

                {st.status === 'issue' && (
                  <div className="mt-3 pl-6 sm:pl-8 space-y-3 animate-fade-in">
                    <Textarea
                      placeholder="Комментарий к незачёту…"
                      value={st.comment}
                      onChange={(e) => set(item.id, { comment: e.target.value })}
                      className="rounded-2xl resize-none bg-background border-border/70"
                      rows={2}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      ref={(el) => (fileRefs.current[item.id] = el)}
                      onChange={(e) => onFile(item.id, e)}
                    />
                    {st.photo ? (
                      <div className="relative inline-block">
                        <img src={st.photo} alt="нарушение" className="h-32 w-32 sm:h-28 sm:w-28 object-cover rounded-2xl" />
                        <button
                          onClick={() => set(item.id, { photo: undefined })}
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileRefs.current[item.id]?.click()}
                        className="flex items-center gap-2 h-10 px-4 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                      >
                        <Icon name="Camera" size={16} /> Прикрепить фото
                      </button>
                    )}
                  </div>
                )}
              </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/80 backdrop-blur-xl shrink-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 text-sm flex-wrap">
            <span className="flex items-center gap-1.5 text-primary font-medium"><Icon name="Check" size={15} />{okCount} зачёт</span>
            <span className="flex items-center gap-1.5 text-destructive font-medium"><Icon name="X" size={15} />{issues} незачёт</span>
            {checked > 0 && (
              <span className="flex items-center gap-1 font-semibold tabular-nums text-foreground border border-border/70 rounded-full px-2.5 py-0.5">
                {score} <span className="text-muted-foreground font-normal text-xs">/ 5</span>
              </span>
            )}
            {hasFines && totalFine > 0 && (
              <span className="flex items-center gap-1.5 font-semibold text-destructive tabular-nums border border-destructive/30 rounded-full px-2.5 py-0.5">
                <Icon name="CircleMinus" size={14} />−{totalFine.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
          <Button
            disabled={checked < data.items.length}
            onClick={() => {
              setFinished(true);
              onComplete?.({
                id: Date.now(),
                title: data.title,
                zone: data.zone,
                score,
                by: finalAssignee,
                restaurant,
                month: `${month} ${year}`,
                time: new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
                issues,
                fine: hasFines ? totalFine : undefined,
              });
            }}
            className="rounded-full px-6 sm:px-8 h-11 gap-2 w-full sm:w-auto"
          >
            Завершить проверку
            <Icon name="ArrowRight" size={16} />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ChecklistRunner;