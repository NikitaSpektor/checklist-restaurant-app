import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RunnerData, CompletedCheck, RESTAURANTS, MONTHS, YEARS } from './types';

interface ChecklistSetupScreenProps {
  data: RunnerData;
  editingCheck?: CompletedCheck;
  onClose: () => void;
  lastName: string;
  setLastName: (v: string) => void;
  firstName: string;
  setFirstName: (v: string) => void;
  isGuestService: boolean;
  waiterName: string;
  setWaiterName: (v: string) => void;
  year: number;
  setYear: (v: number) => void;
  month: string;
  setMonth: (v: string) => void;
  restaurant: string;
  setRestaurant: (v: string) => void;
  canStart: string | boolean;
  finalAssignee: string;
  onStart: () => void;
}

const ChecklistSetupScreen = ({
  data,
  editingCheck,
  onClose,
  lastName,
  setLastName,
  firstName,
  setFirstName,
  isGuestService,
  waiterName,
  setWaiterName,
  year,
  setYear,
  month,
  setMonth,
  restaurant,
  setRestaurant,
  canStart,
  finalAssignee,
  onStart,
}: ChecklistSetupScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      <header className="border-b border-border/60 shrink-0">
        <div className="max-w-lg mx-auto px-5 sm:px-8 h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={onClose}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <div>
            <p className="font-semibold text-sm tracking-tight">{data.title}</p>
            <p className="text-[11px] text-muted-foreground">{editingCheck ? 'Редактирование проверки' : 'Данные проверки'}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 sm:px-8 py-8">
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight mb-2">{editingCheck ? <>Редактирование<br/>проверки</> : <>Перед началом<br/>проверки</>}</h2>
          <p className="text-muted-foreground text-sm mb-8">{editingCheck ? 'Проверьте данные и внесите изменения в пункты' : 'Заполните данные — они войдут в итоговый отчёт'}</p>

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

            {/* Официант (только для чек-листа обслуживания гостей) */}
            {isGuestService && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Официант</p>
                <label className="text-sm font-medium">Фамилия и Имя официанта</label>
                <Input
                  placeholder="Иванов Иван"
                  value={waiterName}
                  onChange={(e) => setWaiterName(e.target.value)}
                  className="rounded-2xl h-12 mt-2"
                />
              </div>
            )}

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
              {isGuestService && waiterName && <span className="flex items-center gap-1.5"><Icon name="UserCheck" size={13} />{waiterName}</span>}
              <span className="flex items-center gap-1.5"><Icon name="CalendarDays" size={13} />{month} {year}</span>
              <span className="flex items-center gap-1.5"><Icon name="MapPin" size={13} />{restaurant}</span>
            </div>
          )}
          <Button
            disabled={!canStart}
            onClick={onStart}
            className="w-full rounded-full h-12 gap-2 text-base"
          >
            {editingCheck ? 'Перейти к пунктам' : 'Начать проверку'}
            <Icon name="ArrowRight" size={18} />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ChecklistSetupScreen;
