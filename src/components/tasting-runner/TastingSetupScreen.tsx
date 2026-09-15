import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RESTAURANTS } from '@/components/checklist-runner/types';

interface TastingSetupScreenProps {
  onClose: () => void;
  lastName: string;
  setLastName: (v: string) => void;
  firstName: string;
  setFirstName: (v: string) => void;
  checkDate: string;
  setCheckDate: (v: string) => void;
  seatingPercent: string;
  setSeatingPercent: (v: string) => void;
  restaurant: string;
  setRestaurant: (v: string) => void;
  canStart: boolean;
  finalAssignee: string;
  onStart: () => void;
  isEditing: boolean;
}

const TastingSetupScreen = ({
  onClose,
  lastName,
  setLastName,
  firstName,
  setFirstName,
  checkDate,
  setCheckDate,
  seatingPercent,
  setSeatingPercent,
  restaurant,
  setRestaurant,
  canStart,
  finalAssignee,
  onStart,
  isEditing,
}: TastingSetupScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      <header className="border-b border-border/60 shrink-0">
        <div className="max-w-lg mx-auto px-5 sm:px-8 h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={onClose}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <div>
            <p className="font-semibold text-sm tracking-tight">Дегустационный лист</p>
            <p className="text-[11px] text-muted-foreground">{isEditing ? 'Редактирование листа' : 'Данные дегустации'}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 sm:px-8 py-8">
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight mb-2">
            {isEditing ? <>Редактирование<br />листа</> : <>Перед началом<br />дегустации</>}
          </h2>
          <p className="text-muted-foreground text-sm mb-8">Заполните данные — они войдут в дегустационный лист</p>

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

            {/* Дата и посадка */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Дата</label>
                <Input
                  type="date"
                  value={checkDate}
                  onChange={(e) => setCheckDate(e.target.value)}
                  className="rounded-2xl h-12"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Посадка, %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="70"
                  value={seatingPercent}
                  onChange={(e) => setSeatingPercent(e.target.value)}
                  className="rounded-2xl h-12"
                />
              </div>
            </div>

            {/* Ресторан */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Место проведения</p>
              <label className="text-sm font-medium">Кафе/Ресторан</label>
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
              <span className="flex items-center gap-1.5"><Icon name="CalendarDays" size={13} />{checkDate}</span>
              <span className="flex items-center gap-1.5"><Icon name="MapPin" size={13} />{restaurant}</span>
            </div>
          )}
          <Button
            disabled={!canStart}
            onClick={onStart}
            className="w-full rounded-full h-12 gap-2 text-base"
          >
            {isEditing ? 'Перейти к дегустации' : 'Начать дегустацию'}
            <Icon name="ArrowRight" size={18} />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default TastingSetupScreen;
