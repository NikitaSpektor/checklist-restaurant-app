import Icon from '@/components/ui/icon';
import { RunnerData } from '@/components/ChecklistRunner';
import { templates, buildRunner } from '@/data/checklistData';

interface TemplatesTabProps {
  setRunner: (data: RunnerData) => void;
}

const TemplatesTab = ({ setRunner }: TemplatesTabProps) => {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-scale-in">
      {templates.map((t) => (
        <div
          key={t.id}
          onClick={() => setRunner(buildRunner(t.zone, t.title))}
          className="group bg-card border border-border/70 rounded-3xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white"
            style={{ backgroundColor: `hsl(${t.color})` }}
          >
            <Icon name={t.icon} size={22} />
          </div>
          <h3 className="font-semibold tracking-tight">{t.title}</h3>
          <p className="text-sm text-muted-foreground">{t.zone} · {t.items} пунктов</p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Запустить <Icon name="ArrowRight" size={15} />
          </div>
        </div>
      ))}
      <button className="border-2 border-dashed border-border rounded-3xl p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors min-h-[150px]">
        <Icon name="Plus" size={24} />
        <span className="text-sm font-medium">Создать шаблон</span>
      </button>
    </div>
  );
};

export default TemplatesTab;
