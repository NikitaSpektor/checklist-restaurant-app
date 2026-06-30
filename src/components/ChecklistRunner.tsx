import { useRef, useState } from 'react';
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

const ChecklistRunner = ({ data, onClose, onComplete }: { data: RunnerData; onClose: () => void; onComplete?: (c: CompletedCheck) => void }) => {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [restaurant, setRestaurant] = useState('');
  const [started, setStarted] = useState(false);
  const [states, setStates] = useState<Record<number, ItemState>>(
    Object.fromEntries(data.items.map((i) => [i.id, { status: 'pending', comment: '' }]))
  );
  const finalAssignee = `${lastName} ${firstName}`.trim();
  const canStart = lastName.trim() && firstName.trim() && restaurant;
  const [finished, setFinished] = useState(false);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});


  const set = (id: number, patch: Partial<ItemState>) =>
    setStates((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const checked = data.items.filter((i) => states[i.id].status !== 'pending').length;
  const okCount = data.items.filter((i) => states[i.id].status === 'ok').length;
  const issues = data.items.filter((i) => states[i.id].status === 'issue').length;
  const score = data.items.length
    ? Math.max(1, parseFloat((5 - (issues / data.items.length) * 4).toFixed(1)))
    : 5;
  const isStandards = data.zone === 'Стандарты';
  const isKitchen = data.zone === 'Кухня';
  const hasFines = isStandards || isKitchen;
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
            <h2 className="font-display text-4xl font-medium tracking-tight mb-2">Перед началом<br/>проверки</h2>
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

              {/* Месяц */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Период</p>
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
                <span className="flex items-center gap-1.5"><Icon name="CalendarDays" size={13} />{month}</span>
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <img
                  src="https://cdn.poehali.dev/projects/da861bac-1ea4-49ae-b39c-72c9841ade32/bucket/0587e8cf-1680-4a82-baf6-adff85516944.png"
                  alt="ICONFOOD"
                  className="h-7 w-auto object-contain mb-3"
                />
                <h1 className="font-display text-3xl font-medium tracking-tight">{data.title}</h1>
                <p className="text-muted-foreground text-sm mt-1">{restaurant} · {month} · {dateStr}</p>
              </div>
              <div className={`w-20 h-20 rounded-2xl shrink-0 flex flex-col items-center justify-center font-semibold tabular-nums ${
                score >= 4 ? 'bg-accent text-accent-foreground' : score >= 3 ? 'bg-secondary text-secondary-foreground' : 'bg-destructive/10 text-destructive'
              }`}>
                <span className="text-2xl leading-none">{score}</span>
                <span className="text-[11px] font-normal mt-0.5 opacity-70">из 5</span>
              </div>
            </div>

            {/* Мета-строка */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: 'User', label: 'Проверяющий', value: finalAssignee },
                { icon: 'CheckCheck', label: 'Зачёт', value: `${okCount} из ${data.items.length}` },
                { icon: 'X', label: 'Незачёт', value: String(issues) },
              ].map((m) => (
                <div key={m.label} className="bg-secondary/50 rounded-2xl p-4">
                  <Icon name={m.icon} size={16} className="text-muted-foreground mb-2" />
                  <p className="text-lg font-semibold tabular-nums">{m.value}</p>
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
              <div className={`rounded-2xl p-5 flex items-center justify-between ${totalFine > 0 ? 'bg-destructive/8 border border-destructive/25' : 'bg-secondary/50 border border-border/60'}`}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Итоговый штраф</p>
                  {isStandards && <p className="text-xs text-muted-foreground">Касса: −1 000 ₽/пункт · Укомплектованность: −3 000 ₽ · Остальные: −500 ₽/пункт</p>}
                  {isKitchen && <p className="text-xs text-muted-foreground">Штраф зависит от пункта: 500 / 1 000 / 3 000 / 5 000 ₽</p>}
                </div>
                <p className={`text-2xl font-bold tabular-nums ${totalFine > 0 ? 'text-destructive' : 'text-primary'}`}>
                  {totalFine > 0 ? `−${totalFine.toLocaleString('ru-RU')} ₽` : '0 ₽'}
                </p>
              </div>
            )}

            {/* Подпись */}
            <div className="border-t border-border/60 pt-6 flex items-center justify-between text-xs text-muted-foreground">
              <span>Ресторанный холдинг ICONFOOD</span>
              <span>{dateStr}</span>
            </div>
          </div>
        </div>

        {/* Футер */}
        <footer className="border-t border-border/60 bg-background shrink-0 print:hidden">
          <div className="max-w-2xl mx-auto px-5 sm:px-8 py-4 flex gap-3">
            <Button variant="outline" className="flex-1 rounded-full h-11" onClick={onClose}>
              Закрыть
            </Button>
            <Button className="flex-1 rounded-full h-11 gap-2" onClick={() => window.print()}>
              <Icon name="FileDown" size={16} />
              Скачать PDF
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
            <p className="text-[11px] text-muted-foreground truncate">{finalAssignee} · {month} · {restaurant}</p>
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
                className={`bg-card border rounded-3xl p-5 transition-all ${
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

                <div className={`flex gap-2 mt-4 pl-8 ${isStandards ? 'flex-wrap' : ''}`}>
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
                  <div className="mt-3 pl-8 space-y-3 animate-fade-in">
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
                        <img src={st.photo} alt="нарушение" className="h-28 w-28 object-cover rounded-2xl" />
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
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm flex-wrap">
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
                month,
                time: new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
                issues,
              });
            }}
            className="rounded-full px-8 h-11 gap-2"
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