import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export interface ChecklistItem {
  id: number;
  text: string;
}

export interface RunnerData {
  title: string;
  zone: string;
  items: ChecklistItem[];
}

type Status = 'pending' | 'ok' | 'issue';

interface ItemState {
  status: Status;
  comment: string;
  photo?: string;
}

const STAFF = [
  { name: 'А. Соколов', role: 'Шеф-повар' },
  { name: 'И. Чен', role: 'Бармен' },
  { name: 'О. Смирнова', role: 'Кондитер' },
  { name: 'М. Левина', role: 'Официант' },
  { name: 'Д. Орлов', role: 'Администратор' },
];

const ChecklistRunner = ({ data, onClose }: { data: RunnerData; onClose: () => void }) => {
  const [assignee, setAssignee] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [states, setStates] = useState<Record<number, ItemState>>(
    Object.fromEntries(data.items.map((i) => [i.id, { status: 'pending', comment: '' }]))
  );
  const finalAssignee = assignee ?? customName;
  const [finished, setFinished] = useState(false);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const set = (id: number, patch: Partial<ItemState>) =>
    setStates((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const checked = data.items.filter((i) => states[i.id].status !== 'pending').length;
  const okCount = data.items.filter((i) => states[i.id].status === 'ok').length;
  const issues = data.items.filter((i) => states[i.id].status === 'issue').length;
  const score = data.items.length ? Math.round((okCount / data.items.length) * 100) : 0;

  const onFile = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set(id, { photo: reader.result as string });
    reader.readAsDataURL(file);
  };

  // Экран выбора сотрудника
  if (!finalAssignee) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
        <header className="border-b border-border/60 shrink-0">
          <div className="max-w-lg mx-auto px-5 sm:px-8 h-16 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={onClose}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <div>
              <p className="font-semibold text-sm tracking-tight">{data.title}</p>
              <p className="text-[11px] text-muted-foreground">Выбор ответственного</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-5 sm:px-8 py-8">
            <h2 className="font-display text-4xl font-medium tracking-tight mb-2">Кто проводит<br/>проверку?</h2>
            <p className="text-muted-foreground text-sm mb-8">Выберите сотрудника из списка или введите имя вручную</p>
            <div className="space-y-2">
              {STAFF.map((s) => (
                <button
                  key={s.name}
                  onClick={() => { setAssignee(s.name); setShowCustom(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    assignee === s.name
                      ? 'border-primary bg-accent'
                      : 'border-border/70 bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-semibold text-sm shrink-0">
                    {s.name.split(' ')[0][0]}{s.name.split(' ')[1]?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.role}</p>
                  </div>
                  {assignee === s.name && <Icon name="Check" size={18} className="text-primary shrink-0" />}
                </button>
              ))}
              <button
                onClick={() => { setAssignee(null); setShowCustom(true); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  showCustom ? 'border-primary bg-accent' : 'border-border/70 border-dashed bg-card hover:border-primary/40'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Icon name="UserPlus" size={18} className="text-muted-foreground" />
                </div>
                <span className="font-medium text-muted-foreground">Другой сотрудник</span>
              </button>
              {showCustom && (
                <div className="animate-fade-in px-1">
                  <Input
                    autoFocus
                    placeholder="Имя и фамилия"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="rounded-2xl h-12"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <footer className="border-t border-border/60 shrink-0">
          <div className="max-w-lg mx-auto px-5 sm:px-8 py-4">
            <Button
              disabled={!assignee && !customName.trim()}
              onClick={() => { if (!assignee) setAssignee(customName.trim()); }}
              className="w-full rounded-full h-12 gap-2 text-base"
            >
              Начать проверку
              <Icon name="ArrowRight" size={18} />
            </Button>
          </div>
        </footer>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6 animate-fade-in">
        <div className="text-center max-w-sm">
          <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 ${
            score >= 90 ? 'bg-accent text-accent-foreground' : score >= 70 ? 'bg-secondary text-secondary-foreground' : 'bg-destructive/10 text-destructive'
          }`}>
            <Icon name="CircleCheck" size={36} />
          </div>
          <h2 className="font-display text-5xl font-medium tracking-tight">{score}%</h2>
          <p className="text-muted-foreground mt-2 mb-1">Проверка «{data.title}» завершена</p>
          <p className="text-sm text-muted-foreground mb-2">
            {okCount} в норме · {issues} нарушени{issues === 1 ? 'е' : 'й'}
          </p>
          <p className="text-sm font-medium mb-8">Ответственный: {finalAssignee}</p>
          <Button onClick={onClose} className="rounded-full px-8 h-11">Готово</Button>
        </div>
      </div>
    );
  }

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
            <p className="text-[11px] text-muted-foreground">{finalAssignee} · {data.zone}</p>
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
            return (
              <div
                key={item.id}
                className={`bg-card border rounded-3xl p-5 transition-all ${
                  st.status === 'ok' ? 'border-primary/30' : st.status === 'issue' ? 'border-destructive/40' : 'border-border/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-muted-foreground tabular-nums mt-1.5 w-5 shrink-0">{idx + 1}</span>
                  <p className="flex-1 font-medium leading-snug">{item.text}</p>
                </div>

                <div className="flex gap-2 mt-4 pl-8">
                  <button
                    onClick={() => set(item.id, { status: st.status === 'ok' ? 'pending' : 'ok' })}
                    className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all ${
                      st.status === 'ok' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                    }`}
                  >
                    <Icon name="Check" size={16} /> В норме
                  </button>
                  <button
                    onClick={() => set(item.id, { status: st.status === 'issue' ? 'pending' : 'issue' })}
                    className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all ${
                      st.status === 'issue' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                    }`}
                  >
                    <Icon name="TriangleAlert" size={16} /> Нарушение
                  </button>
                </div>

                {st.status === 'issue' && (
                  <div className="mt-3 pl-8 space-y-3 animate-fade-in">
                    <Textarea
                      placeholder="Опишите нарушение…"
                      value={st.comment}
                      onChange={(e) => set(item.id, { comment: e.target.value })}
                      className="rounded-2xl resize-none bg-background border-border/70"
                      rows={2}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      ref={(el) => (fileRefs.current[item.id] = el)}
                      onChange={(e) => onFile(item.id, e)}
                    />
                    {st.photo ? (
                      <div className="relative inline-block">
                        <img src={st.photo} alt="нарушение" className="h-28 w-28 object-cover rounded-2xl" />
                        <button
                          onClick={() => set(item.id, { photo: undefined })}
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileRefs.current[item.id]?.click()}
                        className="flex items-center gap-2 h-10 px-4 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                      >
                        <Icon name="Camera" size={16} /> Прикрепить фото
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/80 backdrop-blur-xl shrink-0">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-primary font-medium"><Icon name="Check" size={15} />{okCount}</span>
            <span className="flex items-center gap-1.5 text-destructive font-medium"><Icon name="TriangleAlert" size={15} />{issues}</span>
          </div>
          <Button
            disabled={checked < data.items.length}
            onClick={() => setFinished(true)}
            className="rounded-full px-8 h-11 gap-2"
          >
            Завершить проверку
            <Icon name="ArrowRight" size={16} />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ChecklistRunner;