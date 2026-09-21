import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { downloadElementAsPdf } from '@/lib/pdf';
import PendingQueueBadge from '@/components/PendingQueueBadge';
import { DishRow, calcPrepMinutes, ALL_RECIPIENTS, SEND_URL, UPLOAD_URL } from '@/components/checklist-runner/types';

interface TastingReportScreenProps {
  onClose: () => void;
  finalAssignee: string;
  checkDate: string;
  restaurant: string;
  seatingPercent: string;
  dishes: DishRow[];
  otherComments: string;
  time: string;
}

const TastingReportScreen = ({
  onClose,
  finalAssignee,
  checkDate,
  restaurant,
  seatingPercent,
  dishes,
  otherComments,
  time,
}: TastingReportScreenProps) => {
  const [emailOpen, setEmailOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [pdfLoading, setPdfLoading] = useState(false);

  const filledDishes = dishes.filter((d) => d.name.trim());
  const issueCount = filledDishes.filter((d) => d.appearanceOk === false).length;
  const dateStr = checkDate
    ? new Date(checkDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const toggleRecipient = (email: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

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
      const dishesWithPhotos = await Promise.all(
        filledDishes.map(async (d) => {
          const photos = await Promise.all(
            d.photos.map((p) => (p.startsWith('data:') ? uploadPhoto(p) : Promise.resolve(p)))
          );
          return {
            name: d.name,
            orderTime: d.orderTime,
            serveTime: d.serveTime,
            prepMinutes: calcPrepMinutes(d.orderTime, d.serveTime) ?? '—',
            appearanceOk: d.appearanceOk,
            comment: d.comment || '',
            photos: photos.filter(Boolean),
          };
        })
      );

      const report = {
        kind: 'tasting',
        title: 'Дегустационный лист',
        restaurant,
        checkDate: dateStr,
        seatingPercent: seatingPercent ? Number(seatingPercent) : null,
        by: finalAssignee,
        time,
        dishes: dishesWithPhotos,
        otherComments: otherComments || null,
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
      const fileName = `Дегустационный лист · ${restaurant} · ${checkDate}.pdf`;
      await downloadElementAsPdf('print-tasting-report', fileName);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      <header className="border-b border-border/60 bg-background shrink-0 print:hidden safe-top">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={onClose}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <p className="font-semibold text-sm">Лист сформирован</p>
          <div className="flex items-center gap-2">
            <PendingQueueBadge />
            <Button className="rounded-full gap-2 h-9 px-4" onClick={handleDownloadPdf} disabled={pdfLoading}>
              {pdfLoading
                ? <><Icon name="Loader" size={15} className="animate-spin" /> Готовим…</>
                : <><Icon name="Download" size={15} /> Скачать PDF</>
              }
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div id="print-tasting-report" className="max-w-2xl mx-auto px-5 sm:px-8 py-8 space-y-6">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <img
                src="https://cdn.poehali.dev/projects/da861bac-1ea4-49ae-b39c-72c9841ade32/bucket/0587e8cf-1680-4a82-baf6-adff85516944.png"
                alt="ICONFOOD"
                className="h-6 sm:h-7 w-auto object-contain mb-2 sm:mb-3"
              />
              <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight">Дегустационный лист</h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">{restaurant} · {dateStr}</p>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0 flex flex-col items-center justify-center font-semibold tabular-nums bg-secondary text-secondary-foreground">
              <span className="text-xl sm:text-2xl leading-none">{filledDishes.length}</span>
              <span className="text-[10px] sm:text-[11px] font-normal mt-0.5 opacity-70">блюд</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: 'User', label: 'Проверяющий', value: finalAssignee },
              { icon: 'Users', label: 'Посадка', value: seatingPercent ? `${seatingPercent}%` : '—' },
              { icon: 'CircleAlert', label: 'Замечания', value: String(issueCount) },
            ].map((m) => (
              <div key={m.label} className="bg-secondary/50 rounded-2xl p-3 sm:p-4">
                <Icon name={m.icon} size={16} className="text-muted-foreground mb-2" />
                <p className="text-sm sm:text-lg font-semibold tabular-nums leading-tight">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Блюда и напитки</p>
            <div className="border border-border/70 rounded-2xl overflow-hidden divide-y divide-border/50">
              {filledDishes.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">Нет заполненных блюд</div>
              )}
              {filledDishes.map((d, idx) => {
                const prepMinutes = calcPrepMinutes(d.orderTime, d.serveTime);
                return (
                  <div key={d.id} className={`px-4 py-3 ${d.appearanceOk === false ? 'bg-destructive/5' : ''}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-muted-foreground tabular-nums w-5 shrink-0 pt-0.5 text-sm">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium text-sm">{d.name}</span>
                          <span className={`shrink-0 font-medium text-xs px-2 py-0.5 rounded-full ${
                            d.appearanceOk === true ? 'bg-primary/10 text-primary' : d.appearanceOk === false ? 'bg-destructive/15 text-destructive' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {d.appearanceOk === true ? 'Вид: норма' : d.appearanceOk === false ? 'Вид: замечание' : 'Вид: —'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Заказ {d.orderTime || '—'} · Подача {d.serveTime || '—'} · {prepMinutes != null ? `${prepMinutes} мин` : '—'}
                        </p>
                        {d.comment && <p className="text-sm text-muted-foreground mt-1 italic">«{d.comment}»</p>}
                        {d.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {d.photos.map((photo, pIdx) => (
                              <img key={pIdx} src={photo} alt="фото блюда" className="h-32 w-auto rounded-xl object-cover" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {otherComments && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Прочие комментарии</p>
              <p className="text-sm whitespace-pre-wrap bg-secondary/50 rounded-2xl p-4">{otherComments}</p>
            </div>
          )}

          <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-muted-foreground">
            <span>Ресторанный холдинг ICONFOOD</span>
            <span>{time}</span>
          </div>
        </div>
      </div>

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

      <footer className="border-t border-border/60 bg-background shrink-0 print:hidden safe-bottom">
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

export default TastingReportScreen;