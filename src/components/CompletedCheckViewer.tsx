import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { CompletedCheck } from '@/components/ChecklistRunner';
import { downloadElementAsPdf } from '@/lib/pdf';

interface Props {
  check: CompletedCheck;
  onClose: () => void;
}

const CompletedCheckViewer = ({ check, onClose }: Props) => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const items = check.itemsDetail ?? [];
  const issueItems = items.filter((i) => i.status === 'issue' || i.status === 'issue_no_fine');
  const okCount = check.okCount ?? items.filter((i) => i.status === 'ok').length;
  const totalCount = check.totalCount ?? items.length;
  const score = check.score;

  const grouped: { section: string; items: typeof issueItems }[] = [];
  issueItems.forEach((item) => {
    const sec = item.section ?? 'Без секции';
    const existing = grouped.find((g) => g.section === sec);
    if (existing) existing.items.push(item);
    else grouped.push({ section: sec, items: [item] });
  });

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const fileName = `${check.title} · ${check.restaurant} · ${check.month}.pdf`;
      await downloadElementAsPdf('print-report', fileName);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      <header className="border-b border-border/60 bg-background shrink-0 print:hidden">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={onClose}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <p className="font-semibold text-sm">Просмотр проверки</p>
          <Button className="rounded-full gap-2 h-9 px-4" onClick={handleDownloadPdf} disabled={pdfLoading}>
            {pdfLoading
              ? <><Icon name="Loader" size={15} className="animate-spin" /> Готовим…</>
              : <><Icon name="Download" size={15} /> PDF</>
            }
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div id="print-report" className="max-w-2xl mx-auto px-5 sm:px-8 py-8 space-y-6">

          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <img
                src="https://cdn.poehali.dev/projects/da861bac-1ea4-49ae-b39c-72c9841ade32/bucket/0587e8cf-1680-4a82-baf6-adff85516944.png"
                alt="ICONFOOD"
                className="h-6 sm:h-7 w-auto object-contain mb-2 sm:mb-3"
              />
              <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight">{check.title}</h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">
                {check.restaurant} · {check.month} · {check.time}
              </p>
            </div>
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0 flex flex-col items-center justify-center font-semibold tabular-nums ${
              score >= 4 ? 'bg-accent text-accent-foreground' : score >= 3 ? 'bg-secondary text-secondary-foreground' : 'bg-destructive/10 text-destructive'
            }`}>
              <span className="text-xl sm:text-2xl leading-none">{score}</span>
              <span className="text-[10px] sm:text-[11px] font-normal mt-0.5 opacity-70">из 5</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: 'User', label: 'Проверяющий', value: check.by },
              { icon: 'CheckCheck', label: 'Зачёт', value: `${okCount} из ${totalCount}` },
              { icon: 'X', label: 'Незачёт', value: String(check.issues) },
            ].map((m) => (
              <div key={m.label} className="bg-secondary/50 rounded-2xl p-3 sm:p-4">
                <Icon name={m.icon} size={16} className="text-muted-foreground mb-2" />
                <p className="text-sm sm:text-lg font-semibold tabular-nums leading-tight">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Все пункты проверки</p>
              <div className="border border-border/70 rounded-2xl overflow-hidden">
                {items.map((item, idx) => {
                  const prevSec = idx > 0 ? items[idx - 1].section : null;
                  const showSec = item.section && item.section !== prevSec;
                  return (
                    <div key={item.id}>
                      {showSec && (
                        <div className="px-4 py-2 bg-secondary/40 border-b border-border/50">
                          <span className="text-xs font-semibold uppercase tracking-widest text-primary">{item.section}</span>
                        </div>
                      )}
                      <div className={`flex items-start gap-3 px-4 py-3 text-sm ${idx !== items.length - 1 ? 'border-b border-border/50' : ''} ${item.status === 'issue' || item.status === 'issue_no_fine' ? 'bg-destructive/5' : ''}`}>
                        <span className="text-muted-foreground tabular-nums w-5 shrink-0 pt-0.5">{idx + 1}</span>
                        <span className="flex-1 leading-snug">{item.text}</span>
                        <span className={`shrink-0 font-medium text-xs px-2 py-0.5 rounded-full ${
                          item.status === 'ok' ? 'bg-primary/10 text-primary'
                          : item.status === 'issue' ? 'bg-destructive/15 text-destructive'
                          : item.status === 'issue_no_fine' ? 'bg-amber-500/15 text-amber-600'
                          : item.status === 'na' ? 'bg-border/60 text-muted-foreground'
                          : 'bg-secondary text-muted-foreground'
                        }`}>
                          {item.status === 'ok' ? 'Зачёт' : item.status === 'issue' ? 'Незачёт' : item.status === 'issue_no_fine' ? 'Незачёт б/в' : item.status === 'na' ? 'Неакт.' : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {grouped.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Незачёты · комментарии и фото</p>
              <div className="space-y-5">
                {grouped.map((group) => {
                  let num = 0;
                  return (
                    <div key={group.section}>
                      {group.section !== 'Без секции' && (
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-semibold uppercase tracking-widest text-primary">{group.section}</span>
                          <div className="flex-1 h-px bg-primary/20" />
                        </div>
                      )}
                      <div className="space-y-3">
                        {group.items.map((item) => {
                          num += 1;
                          return (
                            <div key={item.id} className="border border-destructive/25 rounded-2xl p-4 space-y-3">
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-destructive/15 text-destructive flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                                  {num}
                                </span>
                                <p className="text-sm font-medium leading-snug flex-1">{item.text}</p>
                                {item.status === 'issue_no_fine' && (
                                  <span className="shrink-0 text-[11px] font-medium text-amber-600 bg-amber-500/15 rounded-full px-2 py-0.5">без вычета</span>
                                )}
                              </div>
                              {item.comment && (
                                <p className="text-sm text-muted-foreground pl-7 italic">«{item.comment}»</p>
                              )}
                              {item.photo && (
                                <div className="pl-7">
                                  <img src={item.photo} alt="фото нарушения" className="h-40 w-auto rounded-xl object-cover" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {check.fine != null && (
            <div className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${check.fine > 0 ? 'bg-destructive/8 border border-destructive/25' : 'bg-secondary/50 border border-border/60'}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Итоговое депремирование</p>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${check.fine > 0 ? 'text-destructive' : 'text-primary'}`}>
                {check.fine > 0 ? `−${check.fine.toLocaleString('ru-RU')} ₽` : '0 ₽'}
              </p>
            </div>
          )}

          {check.finesDistribution && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Распределение депремирования между сотрудниками</p>
              <p className="text-sm whitespace-pre-wrap bg-secondary/50 rounded-2xl p-4">{check.finesDistribution}</p>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Icon name="FileX" size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Детали недоступны</p>
              <p className="text-sm mt-1">Эта проверка была завершена до обновления — детали не сохранились</p>
            </div>
          )}

          <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-muted-foreground">
            <span>Ресторанный холдинг ICONFOOD</span>
            <span>{check.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedCheckViewer;