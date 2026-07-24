import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { downloadElementAsPdf } from '@/lib/pdf';
import { RunnerData, ItemState, ALL_RECIPIENTS, SEND_URL, UPLOAD_URL } from './types';

interface ChecklistReportScreenProps {
  data: RunnerData;
  onClose: () => void;
  states: Record<number, ItemState>;
  restaurant: string;
  month: string;
  year: number;
  finalAssignee: string;
  waiterName: string;
  isGuestService: boolean;
  score: number;
  okCount: number;
  issues: number;
  naCount: number;
  hasFines: boolean;
  totalFine: number;
  isStandards: boolean;
  isKitchen: boolean;
  isPastry: boolean;
  isBar: boolean;
  isDrinks: boolean;
  finesDistribution: string;
  setFinesDistribution: (v: string) => void;
}

const ChecklistReportScreen = ({
  data,
  onClose,
  states,
  restaurant,
  month,
  year,
  finalAssignee,
  waiterName,
  isGuestService,
  score,
  okCount,
  issues,
  naCount,
  hasFines,
  totalFine,
  isStandards,
  isKitchen,
  isPastry,
  isBar,
  isDrinks,
  finesDistribution,
  setFinesDistribution,
}: ChecklistReportScreenProps) => {
  const [emailOpen, setEmailOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [pdfLoading, setPdfLoading] = useState(false);

  const toggleRecipient = (email: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const issueItems = data.items.filter((i) => states[i.id].status === 'issue' || states[i.id].status === 'issue_no_fine');
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  const uploadPhoto = async (base64: string): Promise<string | null> => {
    try {
      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: base64 }),
      });
      const uploaded = await res.json();
      return uploaded.url || null;
    } catch {
      return null;
    }
  };

  const sendReport = async () => {
    setSendStatus('sending');
    try {
      // Загружаем все base64-фото в S3, заменяем на CDN-ссылки
      const issuesWithPhotos = await Promise.all(
        issueItems.map(async (item) => {
          const st = states[item.id];
          const photos = await Promise.all(
            st.photos.map((p) => (p.startsWith('data:') ? uploadPhoto(p) : Promise.resolve(p)))
          );
          return { text: item.text, comment: st.comment || '', photo: photos[0] ?? null, photos: photos.filter(Boolean), no_fine: st.status === 'issue_no_fine' };
        })
      );

      const report = {
        title: data.title,
        zone: data.zone,
        restaurant,
        month: `${month} ${year}`,
        time: now.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
        by: finalAssignee,
        waiter: waiterName || null,
        score,
        ok_count: okCount,
        issues_count: issues,
        total: data.items.length,
        fine: hasFines ? totalFine : null,
        items: data.items.map((item) => ({ text: item.text, status: states[item.id].status, comment: states[item.id].comment || '' })),
        issues: issuesWithPhotos,
        fines_distribution: (isBar || isKitchen || isPastry) && finesDistribution ? finesDistribution : null,
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

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const fileName = `${data.title} · ${restaurant} · ${month} ${year}.pdf`;
      await downloadElementAsPdf('print-report', fileName);
    } finally {
      setPdfLoading(false);
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
          <Button className="rounded-full gap-2 h-9 px-4" onClick={handleDownloadPdf} disabled={pdfLoading}>
            {pdfLoading
              ? <><Icon name="Loader" size={15} className="animate-spin" /> Готовим…</>
              : <><Icon name="Download" size={15} /> Скачать PDF</>
            }
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
          <div className={`grid gap-2 sm:gap-3 ${isGuestService && waiterName ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
            {[
              { icon: 'User', label: 'Проверяющий', value: finalAssignee },
              ...(isGuestService && waiterName ? [{ icon: 'UserCheck', label: 'Официант', value: waiterName }] : []),
              { icon: 'CheckCheck', label: 'Зачёт', value: `${okCount} из ${data.items.length - naCount}` },
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
                    className={`px-4 py-3 text-sm ${idx !== data.items.length - 1 ? 'border-b border-border/50' : ''} ${
                      st.status === 'issue' || st.status === 'issue_no_fine' ? 'bg-destructive/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-muted-foreground tabular-nums w-5 shrink-0 pt-0.5">{idx + 1}</span>
                      <span className="flex-1 leading-snug">{item.text}</span>
                      <span className={`shrink-0 font-medium text-xs px-2 py-0.5 rounded-full ${
                        st.status === 'ok'
                          ? 'bg-primary/10 text-primary'
                          : st.status === 'issue'
                          ? 'bg-destructive/15 text-destructive'
                          : st.status === 'issue_no_fine'
                          ? 'bg-amber-500/15 text-amber-600'
                          : st.status === 'na'
                          ? 'bg-border/60 text-muted-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}>
                        {st.status === 'ok' ? 'Зачёт' : st.status === 'issue' ? 'Незачёт' : st.status === 'issue_no_fine' ? 'Незачёт б/в' : st.status === 'na' ? 'Неакт.' : '—'}
                      </span>
                    </div>
                    {st.status === 'ok' && st.comment && (
                      <p className="text-sm text-muted-foreground pl-8 mt-1 italic">«{st.comment}»</p>
                    )}
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
                                <p className="text-sm font-medium leading-snug flex-1">{item.text}</p>
                                {st.status === 'issue_no_fine' && (
                                  <span className="shrink-0 text-[11px] font-medium text-amber-600 bg-amber-500/15 rounded-full px-2 py-0.5">без вычета</span>
                                )}
                              </div>
                              {st.comment && (
                                <p className="text-sm text-muted-foreground pl-7 italic">«{st.comment}»</p>
                              )}
                              {st.photos.length > 0 && (
                                <div className="pl-7 flex flex-wrap gap-2">
                                  {st.photos.map((photo, pIdx) => (
                                    <img key={pIdx} src={photo} alt="фото нарушения" className="h-40 w-auto rounded-xl object-cover" />
                                  ))}
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

          {/* Итоговое депремирование */}
          {hasFines && (
            <div className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${totalFine > 0 ? 'bg-destructive/8 border border-destructive/25' : 'bg-secondary/50 border border-border/60'}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Итоговое депремирование</p>
                {isStandards && <p className="text-xs text-muted-foreground">Касса: −1 000 ₽/пункт · Укомплектованность: −3 000 ₽ · Остальные: −500 ₽/пункт</p>}
                {isKitchen && <p className="text-xs text-muted-foreground">Депремирование зависит от пункта: 500 / 1 000 / 3 000 / 5 000 ₽</p>}
                {isPastry && <p className="text-xs text-muted-foreground">Депремирование зависит от пункта: 500 или 1 000 ₽</p>}
                {isBar && <p className="text-xs text-muted-foreground">Депремирование зависит от пункта: 300 / 600 / 1 000 ₽</p>}
                {isGuestService && <p className="text-xs text-muted-foreground">Депремирование зависит от пункта: от 100 до 500 ₽</p>}
                {isDrinks && <p className="text-xs text-muted-foreground">Каждый незачёт: −300 ₽</p>}
                <p className="text-xs text-muted-foreground mt-0.5">«Незачёт, без вычета» влияет на балл, но не входит в сумму депремирования</p>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${totalFine > 0 ? 'text-destructive' : 'text-primary'}`}>
                {totalFine > 0 ? `−${totalFine.toLocaleString('ru-RU')} ₽` : '0 ₽'}
              </p>
            </div>
          )}

          {/* Распределение депремирования между сотрудниками (Бар, Кухня, Кондитер) */}
          {(isBar || isKitchen || isPastry) && (
            <div className="print:hidden">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Распределение депремирования между сотрудниками</p>
              <Textarea
                placeholder="Например: Иванов — 600 ₽ (пункт 2), Петров — 300 ₽ (пункт 10)…"
                value={finesDistribution}
                onChange={(e) => setFinesDistribution(e.target.value)}
                className="rounded-2xl resize-none bg-background border-border/70"
                rows={4}
              />
            </div>
          )}
          {(isBar || isKitchen || isPastry) && finesDistribution && (
            <div className="hidden print:block">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Распределение депремирования между сотрудниками</p>
              <p className="text-sm whitespace-pre-wrap">{finesDistribution}</p>
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
          <Button className="flex-1 rounded-full h-11 gap-2" onClick={handleDownloadPdf} disabled={pdfLoading}>
            {pdfLoading
              ? <Icon name="Loader" size={16} className="animate-spin" />
              : <Icon name="FileDown" size={16} />
            }
            PDF
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ChecklistReportScreen;
