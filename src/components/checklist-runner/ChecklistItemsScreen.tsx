import { MutableRefObject } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RunnerData, CompletedCheck, ItemState } from './types';

interface ChecklistItemsScreenProps {
  data: RunnerData;
  onClose: () => void;
  finalAssignee: string;
  month: string;
  year: number;
  restaurant: string;
  checked: number;
  states: Record<number, ItemState>;
  set: (id: number, patch: Partial<ItemState>) => void;
  hasFines: boolean;
  isStandards: boolean;
  okCount: number;
  issues: number;
  score: number;
  totalFine: number;
  fileRefs: MutableRefObject<Record<number, HTMLInputElement | null>>;
  onFile: (id: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (id: number, index: number) => void;
  editingCheck?: CompletedCheck;
  isGuestService: boolean;
  waiterName: string;
  isBar: boolean;
  isKitchen: boolean;
  isPastry: boolean;
  finesDistribution: string;
  onComplete?: (c: CompletedCheck) => void;
  setFinished: (v: boolean) => void;
}

const ChecklistItemsScreen = ({
  data,
  onClose,
  finalAssignee,
  month,
  year,
  restaurant,
  checked,
  states,
  set,
  hasFines,
  isStandards,
  okCount,
  issues,
  score,
  totalFine,
  fileRefs,
  onFile,
  removePhoto,
  editingCheck,
  isGuestService,
  waiterName,
  isBar,
  isKitchen,
  isPastry,
  finesDistribution,
  onComplete,
  setFinished,
}: ChecklistItemsScreenProps) => {
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
                  st.status === 'ok' ? 'border-primary/30' : st.status === 'issue' ? 'border-destructive/40' : st.status === 'issue_no_fine' ? 'border-amber-400/50' : st.status === 'na' ? 'border-border/40 opacity-50' : 'border-border/70'
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
                    className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all min-w-[100px] ${
                      st.status === 'ok' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                    }`}
                  >
                    <Icon name="Check" size={16} /> Зачёт
                  </button>
                  <button
                    onClick={() => set(item.id, { status: st.status === 'issue' ? 'pending' : 'issue' })}
                    className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all min-w-[100px] ${
                      st.status === 'issue' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                    }`}
                  >
                    <Icon name="X" size={16} /> Незачёт
                  </button>
                  <button
                    onClick={() => set(item.id, { status: st.status === 'issue_no_fine' ? 'pending' : 'issue_no_fine' })}
                    className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all min-w-[150px] ${
                      st.status === 'issue_no_fine' ? 'bg-amber-500 text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                    }`}
                  >
                    <Icon name="CircleMinus" size={16} /> Незачёт, без вычета
                  </button>
                  {(isStandards || item.hasNa) && (
                    <button
                      onClick={() => set(item.id, { status: st.status === 'na' ? 'pending' : 'na', comment: '', photos: [] })}
                      className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all min-w-[110px] ${
                        st.status === 'na' ? 'bg-muted-foreground/20 text-muted-foreground ring-1 ring-border' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                      }`}
                    >
                      <Icon name="Minus" size={16} /> Неактуально
                    </button>
                  )}
                </div>

                {(st.status === 'ok' || st.status === 'issue' || st.status === 'issue_no_fine') && (
                  <div className="mt-3 pl-6 sm:pl-8 space-y-3 animate-fade-in">
                    <Textarea
                      placeholder={st.status === 'ok' ? 'Комментарий к зачёту…' : 'Комментарий к незачёту…'}
                      value={st.comment}
                      onChange={(e) => set(item.id, { comment: e.target.value })}
                      className="rounded-2xl resize-none bg-background border-border/70"
                      rows={2}
                    />
                    {(st.status === 'issue' || st.status === 'issue_no_fine') && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          ref={(el) => (fileRefs.current[item.id] = el)}
                          onChange={(e) => onFile(item.id, e)}
                        />
                        <div className="flex flex-wrap gap-2">
                          {st.photos.map((photo, idx) => (
                            <div key={idx} className="relative inline-block">
                              <img src={photo} alt="нарушение" className="h-32 w-32 sm:h-28 sm:w-28 object-cover rounded-2xl" />
                              <button
                                onClick={() => removePhoto(item.id, idx)}
                                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
                              >
                                <Icon name="X" size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => fileRefs.current[item.id]?.click()}
                            className="flex items-center gap-2 h-10 px-4 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                          >
                            <Icon name="Camera" size={16} /> {st.photos.length > 0 ? 'Добавить ещё' : 'Прикрепить фото'}
                          </button>
                        </div>
                      </>
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
                id: editingCheck?.id ?? Date.now(),
                title: data.title,
                zone: data.zone,
                score,
                by: finalAssignee,
                waiter: isGuestService && waiterName ? waiterName : undefined,
                restaurant,
                month: `${month} ${year}`,
                time: editingCheck?.time ?? new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
                issues,
                fine: hasFines ? totalFine : undefined,
                okCount,
                totalCount: data.items.length,
                itemsDetail: data.items.map((i) => ({
                  id: i.id,
                  text: i.text,
                  section: i.section,
                  fine: i.fine,
                  status: states[i.id].status,
                  comment: states[i.id].comment,
                  photos: states[i.id].photos,
                })),
                finesDistribution: (isBar || isKitchen || isPastry) && finesDistribution ? finesDistribution : undefined,
                editHistory: editingCheck
                  ? [
                      ...(editingCheck.editHistory ?? []),
                      { by: finalAssignee, time: new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) },
                    ]
                  : undefined,
              });
            }}
            className="rounded-full px-6 sm:px-8 h-11 gap-2 w-full sm:w-auto"
          >
            {editingCheck ? 'Сохранить изменения' : 'Завершить проверку'}
            <Icon name="ArrowRight" size={16} />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ChecklistItemsScreen;