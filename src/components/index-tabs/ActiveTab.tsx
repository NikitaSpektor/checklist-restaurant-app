import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RunnerData } from '@/components/ChecklistRunner';
import { activeChecks, buildRunner } from '@/data/checklistData';

interface ActiveTabProps {
  setRunner: (data: RunnerData) => void;
}

const ActiveTab = ({ setRunner }: ActiveTabProps) => {
  return (
    <div className="grid gap-4 animate-scale-in">
      {activeChecks.map((c) => (
        <div
          key={c.id}
          onClick={() => setRunner(buildRunner(c.zone, c.title))}
          className="group bg-card border border-border/70 rounded-3xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="secondary" className="rounded-full font-normal">{c.zone}</Badge>
                {c.issues > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
                    <Icon name="Camera" size={13} />
                    {c.issues} нарушени{c.issues === 1 ? 'е' : 'я'}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-lg tracking-tight">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{c.by} · {c.time}</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Icon name="ArrowRight" size={18} />
            </Button>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <Progress value={(c.done / c.total) * 100} className="h-2" />
            <span className="text-sm font-medium tabular-nums text-muted-foreground whitespace-nowrap">
              {c.done}/{c.total}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActiveTab;
