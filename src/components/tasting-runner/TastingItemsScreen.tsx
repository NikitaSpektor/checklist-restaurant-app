import { MutableRefObject } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PendingQueueBadge from '@/components/PendingQueueBadge';
import { DishRow, calcPrepMinutes } from '@/components/checklist-runner/types';

interface TastingItemsScreenProps {
  onClose: () => void;
  finalAssignee: string;
  checkDate: string;
  restaurant: string;
  dishes: DishRow[];
  setDish: (id: number, patch: Partial<DishRow>) => void;
  addDish: () => void;
  removeDish: (id: number) => void;
  otherComments: string;
  setOtherComments: (v: string) => void;
  fileRefs: MutableRefObject<Record<number, HTMLInputElement | null>>;
  onFile: (id: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (id: number, index: number) => void;
  onFinish: () => void;
  isEditing: boolean;
}

const TastingItemsScreen = ({
  onClose,
  finalAssignee,
  checkDate,
  restaurant,
  dishes,
  setDish,
  addDish,
  removeDish,
  otherComments,
  setOtherComments,
  fileRefs,
  onFile,
  removePhoto,
  onFinish,
  isEditing,
}: TastingItemsScreenProps) => {
  const filledCount = dishes.filter((d) => d.name.trim()).length;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl shrink-0">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={onClose}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <div className="flex-1 text-center min-w-0">
            <p className="font-semibold text-sm tracking-tight truncate">Дегустационный лист</p>
            <p className="text-[11px] text-muted-foreground truncate">{finalAssignee} · {checkDate} · {restaurant}</p>
          </div>
          <PendingQueueBadge />
          <span className="text-sm font-medium tabular-nums text-muted-foreground w-12 text-right">
            {filledCount}/{dishes.length}
          </span>
        </div>
      </header>

      {/* Dishes */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-6 space-y-3">
          {dishes.map((d, idx) => {
            const prepMinutes = calcPrepMinutes(d.orderTime, d.serveTime);
            return (
              <div
                key={d.id}
                className={`bg-card border rounded-3xl p-4 sm:p-5 transition-all ${
                  d.appearanceOk === false ? 'border-destructive/40' : d.appearanceOk === true ? 'border-primary/30' : 'border-border/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-muted-foreground tabular-nums mt-3 w-5 shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0 space-y-3">
                    <Input
                      placeholder="Наименование блюда/напитка"
                      value={d.name}
                      onChange={(e) => setDish(d.id, { name: e.target.value })}
                      className="rounded-2xl h-11 bg-background border-border/70 font-medium"
                    />

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Время заказа</label>
                        <Input
                          type="time"
                          value={d.orderTime}
                          onChange={(e) => setDish(d.id, { orderTime: e.target.value })}
                          className="rounded-xl h-10 bg-background border-border/70"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Время подачи</label>
                        <Input
                          type="time"
                          value={d.serveTime}
                          onChange={(e) => setDish(d.id, { serveTime: e.target.value })}
                          className="rounded-xl h-10 bg-background border-border/70"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      {prepMinutes != null ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary rounded-full px-2.5 py-1">
                          <Icon name="Clock" size={12} /> {prepMinutes} мин приготовления
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Укажите время заказа и подачи</span>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Внешний вид</span>
                        <button
                          onClick={() => setDish(d.id, { appearanceOk: d.appearanceOk === true ? null : true })}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            d.appearanceOk === true ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                          }`}
                        >
                          <Icon name="Plus" size={15} />
                        </button>
                        <button
                          onClick={() => setDish(d.id, { appearanceOk: d.appearanceOk === false ? null : false, photos: d.appearanceOk === false ? [] : d.photos })}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            d.appearanceOk === false ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                          }`}
                        >
                          <Icon name="Minus" size={15} />
                        </button>
                      </div>
                    </div>

                    <Textarea
                      placeholder="Комментарии по блюду/напитку…"
                      value={d.comment}
                      onChange={(e) => setDish(d.id, { comment: e.target.value })}
                      className="rounded-2xl resize-none bg-background border-border/70"
                      rows={2}
                    />

                    {d.appearanceOk === false && (
                      <div className="animate-fade-in">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          ref={(el) => (fileRefs.current[d.id] = el)}
                          onChange={(e) => onFile(d.id, e)}
                        />
                        <div className="flex flex-wrap gap-2">
                          {d.photos.map((photo, pIdx) => (
                            <div key={pIdx} className="relative inline-block">
                              <img src={photo} alt="фото блюда" className="h-28 w-28 object-cover rounded-2xl" />
                              <button
                                onClick={() => removePhoto(d.id, pIdx)}
                                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
                              >
                                <Icon name="X" size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => fileRefs.current[d.id]?.click()}
                            className="flex items-center gap-2 h-10 px-4 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                          >
                            <Icon name="Camera" size={16} /> {d.photos.length > 0 ? 'Добавить ещё' : 'Прикрепить фото'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {dishes.length > 1 && (
                    <button
                      onClick={() => removeDish(d.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 mt-1"
                      title="Удалить строку"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <button
            onClick={addDish}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
          >
            <Icon name="Plus" size={16} /> Добавить блюдо
          </button>

          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Прочие комментарии</p>
            <Textarea
              placeholder="Общие впечатления, замечания к дегустации…"
              value={otherComments}
              onChange={(e) => setOtherComments(e.target.value)}
              className="rounded-2xl resize-none bg-background border-border/70"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/80 backdrop-blur-xl shrink-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{filledCount} из {dishes.length} блюд заполнено</span>
          <Button onClick={onFinish} className="rounded-full px-6 sm:px-8 h-11 gap-2">
            {isEditing ? 'Сохранить изменения' : 'Завершить дегустацию'}
            <Icon name="ArrowRight" size={16} />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default TastingItemsScreen;
