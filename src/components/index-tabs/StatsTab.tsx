import Icon from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CompletedCheck } from '@/components/ChecklistRunner';
import { ZONES } from '@/data/checklistData';

interface StatItem {
  label: string;
  value: string;
  sub: string;
  icon: string;
}

interface ZoneScore {
  zone: string;
  score: number;
}

interface StatsTabProps {
  restaurants: string[];
  statsRestaurant: string;
  setStatsRestaurant: (v: string) => void;
  statsZone: string;
  setStatsZone: (v: string) => void;
  periods: string[];
  statsPeriod: string;
  setStatsPeriod: (v: string) => void;
  stats: StatItem[];
  zoneScores: ZoneScore[];
  filteredCompleted: CompletedCheck[];
  setViewingCheck: (c: CompletedCheck) => void;
}

const StatsTab = ({
  restaurants,
  statsRestaurant,
  setStatsRestaurant,
  statsZone,
  setStatsZone,
  periods,
  statsPeriod,
  setStatsPeriod,
  stats,
  zoneScores,
  filteredCompleted,
  setViewingCheck,
}: StatsTabProps) => {
  return (
    <div className="animate-scale-in space-y-6">
      {/* Фильтры */}
      <div className="space-y-3">
        {/* По ресторану */}
        {restaurants.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Ресторан</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setStatsRestaurant('all')} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statsRestaurant === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}>Все</button>
              {restaurants.map((r) => (
                <button key={r} onClick={() => setStatsRestaurant(r)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statsRestaurant === r ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}>{r}</button>
              ))}
            </div>
          </div>
        )}
        {/* По подразделению */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Подразделение</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setStatsZone('all')} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statsZone === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}>Все</button>
            {ZONES.map((z) => (
              <button key={z} onClick={() => setStatsZone(z)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statsZone === z ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}>{z}</button>
            ))}
          </div>
        </div>
        {/* По периоду */}
        {periods.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Период</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setStatsPeriod('all')} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statsPeriod === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}>Все</button>
              {periods.map((p) => (
                <button key={p} onClick={() => setStatsPeriod(p)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statsPeriod === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border/70 rounded-3xl p-4 sm:p-5">
            <Icon name={s.icon} size={18} className="text-primary mb-2 sm:mb-3" />
            <p className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums">{s.value}</p>
            <p className="text-sm font-medium mt-1">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border/70 rounded-3xl p-6">
        <h3 className="font-semibold tracking-tight mb-5">Качество по зонам</h3>
        <div className="space-y-4">
          {zoneScores.map((z) => (
            <div key={z.zone} className="flex items-center gap-4">
              <span className="text-sm w-24 shrink-0 truncate">{z.zone}</span>
              <Progress value={z.score} className="h-2.5" />
              <span className="text-sm font-medium tabular-nums w-10 text-right">{z.score}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card border border-border/70 rounded-3xl p-6">
        <h3 className="font-semibold tracking-tight mb-5">Итоговые баллы по проверкам</h3>
        {filteredCompleted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Нет проверок по выбранным фильтрам</p>
        ) : (
          <div className="space-y-2">
            {filteredCompleted.map((c) => (
              <button
                key={c.id}
                onClick={() => setViewingCheck(c)}
                className="w-full flex items-center gap-3 sm:gap-4 rounded-2xl px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-semibold tabular-nums text-sm ${
                  c.score >= 4 ? 'bg-accent text-accent-foreground' : c.score >= 3 ? 'bg-secondary text-secondary-foreground' : 'bg-destructive/10 text-destructive'
                }`}>
                  {c.score}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{c.title}</span>
                    <Badge variant="secondary" className="rounded-full font-normal text-[10px] px-2 py-0">{c.zone}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.restaurant} · {c.month} · {c.by}
                  </p>
                </div>
                {c.fine != null && c.fine > 0 && (
                  <span className="shrink-0 text-xs font-semibold text-destructive bg-destructive/10 rounded-full px-2 py-0.5">
                    −{c.fine.toLocaleString('ru-RU')} ₽
                  </span>
                )}
                <Icon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsTab;
