import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { CompletedCheck } from '@/components/ChecklistRunner';
import { doneChecks } from '@/data/checklistData';

interface DoneTabProps {
  loading: boolean;
  completed: CompletedCheck[];
  filteredDone: CompletedCheck[];
  doneZones: string[];
  doneMonths: string[];
  doneZoneFilter: string;
  setDoneZoneFilter: (v: string) => void;
  doneMonthFilter: string;
  setDoneMonthFilter: (v: string) => void;
  setViewingCheck: (c: CompletedCheck) => void;
  handleEdit: (c: CompletedCheck) => void;
  handleDelete: (id: number) => void;
}

const DoneTab = ({
  loading,
  completed,
  filteredDone,
  doneZones,
  doneMonths,
  doneZoneFilter,
  setDoneZoneFilter,
  doneMonthFilter,
  setDoneMonthFilter,
  setViewingCheck,
  handleEdit,
  handleDelete,
}: DoneTabProps) => {
  return (
    <div className="grid gap-4 animate-scale-in">
      {!loading && completed.length > 0 && doneZones.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setDoneZoneFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${doneZoneFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}
          >
            Все типы
          </button>
          {doneZones.map((z) => (
            <button
              key={z}
              onClick={() => setDoneZoneFilter(z)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${doneZoneFilter === z ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}
            >
              {z}
            </button>
          ))}
        </div>
      )}
      {!loading && completed.length > 0 && doneMonths.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setDoneMonthFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${doneMonthFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}
          >
            Все месяцы
          </button>
          {doneMonths.map((m) => (
            <button
              key={m}
              onClick={() => setDoneMonthFilter(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${doneMonthFilter === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="Loader" size={32} className="mx-auto mb-3 opacity-40 animate-spin" />
          <p className="text-sm">Загрузка проверок...</p>
        </div>
      )}
      {!loading && completed.length === 0 && doneChecks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="ClipboardCheck" size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Завершённых проверок пока нет</p>
          <p className="text-sm mt-1">Проведите первую проверку, чтобы она появилась здесь</p>
        </div>
      )}
      {!loading && completed.length > 0 && filteredDone.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="FilterX" size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Нет проверок по выбранным фильтрам</p>
        </div>
      )}
      {!loading && [...filteredDone, ...doneChecks].map((c) => (
        <div key={c.id} className="bg-card border border-border/70 rounded-3xl p-4 sm:p-6 flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-semibold tabular-nums shrink-0 ${
              c.score >= 4 ? 'bg-accent text-accent-foreground' : c.score >= 3 ? 'bg-secondary text-secondary-foreground' : 'bg-destructive/10 text-destructive'
            }`}>
              <span className="text-lg leading-none">{c.score}</span>
              <span className="text-[10px] font-normal opacity-60">из 5</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="secondary" className="rounded-full font-normal">{c.zone}</Badge>
                {'issues' in c && c.issues > 0 && (
                  <span className="text-xs text-destructive font-medium">{c.issues} незачёт</span>
                )}
                {'fine' in c && c.fine != null && c.fine > 0 && (
                  <span className="text-xs font-semibold text-destructive bg-destructive/10 rounded-full px-2 py-0.5">
                    −{c.fine.toLocaleString('ru-RU')} ₽
                  </span>
                )}
                {'editHistory' in c && c.editHistory && c.editHistory.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                    <Icon name="History" size={11} />изменено
                  </span>
                )}
              </div>
              <h3 className="font-semibold tracking-tight">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{c.by} · {c.time}</p>
              {'restaurant' in c && c.restaurant && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Icon name="MapPin" size={11} />{c.restaurant}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button
              onClick={() => setViewingCheck(c as CompletedCheck)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Просмотр"
            >
              <Icon name="Eye" size={14} />
            </button>
            {'id' in c && completed.some((x) => x.id === c.id) && (
              <>
                <button
                  onClick={() => handleEdit(c as CompletedCheck)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Редактировать"
                >
                  <Icon name="Pencil" size={14} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Удалить"
                >
                  <Icon name="Trash2" size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DoneTab;
