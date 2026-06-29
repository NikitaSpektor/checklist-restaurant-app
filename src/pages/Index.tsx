import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import ChecklistRunner, { RunnerData } from '@/components/ChecklistRunner';

type Tab = 'active' | 'done' | 'templates' | 'stats';

const ITEMS_BY_ZONE: Record<string, string[]> = {
  'Бар': [
    'Барная стойка вымыта и продезинфицирована',
    'Все бокалы и рюмки без следов, сколов и трещин',
    'Кофемашина промыта, бункер зёрен заполнен',
    'Молочный тракт кофемашины прочищен',
    'Запасы алкоголя пополнены согласно стоп-листу',
    'Безалкогольные напитки охлаждены до нужной температуры',
    'Лёд свежий, без посторонних запахов',
    'Барный инвентарь (шейкер, джиггер, стрейнер) чист',
    'Гарниры и топпинги готовы к работе',
    'Холодильник бара: температура ≤ +4°C',
    'Барная карта и QR-коды без повреждений',
    'Мусорное ведро бара опустошено',
  ],
  'Кухня': [
    'Все рабочие поверхности продезинфицированы',
    'Холодильники: температура ≤ +4°C, морозилки ≤ -18°C',
    'Все заготовки промаркированы датой и временем',
    'Разделочные доски разделены по цветам (мясо/рыба/овощи)',
    'Ножи заточены, чистые, без ржавчины',
    'Вытяжные фильтры очищены от жирового налёта',
    'Полы вымыты, жира и луж нет',
    'Плиты и жарочные поверхности очищены',
    'Фритюрное масло проверено на свежесть',
    'Остатки пищи утилизированы согласно регламенту',
    'Санитарные журналы заполнены',
    'Спецодежда повара чистая, соответствует стандарту',
    'Аптечка укомплектована',
    'Нет просроченных ингредиентов в зоне выдачи',
  ],
  'Кондитер': [
    'Рабочее место кондитера убрано и продезинфицировано',
    'Весы откалиброваны (проверка с эталонным грузом)',
    'Холодильник витрины: температура +2°C…+6°C',
    'Выпечка и десерты правильно промаркированы',
    'Кремы и муссы хранятся в закрытых ёмкостях',
    'Сырьё (мука, сахар, яйца) проверено по срокам',
    'Яйца продезинфицированы перед использованием',
    'Формы и кондитерские мешки вымыты',
    'Температура шоколадного фонтана/темперирования в норме',
    'Витрина с десертами чистая, ценники актуальны',
    'Нет перекрёстного контакта аллергенов',
    'Дневной план выпечки сверен с заявкой',
  ],
  'Стандарты': [
    'Сотрудники в форме согласно дресс-коду',
    'Бейджи надеты, имя читаемо',
    'Волосы убраны под сетку или резинку',
    'Руки вымыты, ногти коротко пострижены',
    'Ювелирные украшения сняты (кроме обручального кольца)',
    'Телефоны убраны в личные зоны',
    'Приветствие гостя в течение 30 секунд от входа',
    'Меню предложено и описано корректно',
    'Время выноса блюд соответствует стандарту',
    'Официант знает состав блюд и аллергены',
    'Расчёт произведён в течение 5 минут после просьбы',
    'Прощание с гостем выполнено по стандарту',
    'Жалобная книга доступна по первому требованию',
  ],
  'Оценка напитков': [
    'Эспрессо: цвет крема насыщенный (лесной орех)',
    'Эспрессо: экстракция 25–30 секунд',
    'Капучино: температура молока 60–65°C',
    'Капучино: микропена однородная, без пузырей',
    'Латте-арт: рисунок чёткий, симметричный',
    'Свежевыжатые соки: выжимка сделана не более 20 мин назад',
    'Лимонад: уровень сахара и кислоты соответствует рецепту',
    'Коктейль: объём в стакане соответствует порции (мл)',
    'Коктейль: гарнир свежий, не завявший',
    'Чай: вода не выше 95°C для чёрного, 80°C для зелёного',
    'Температура подачи горячих напитков соответствует стандарту',
    'Посуда для подачи без сколов и налёта',
    'Соответствие напитка описанию в меню',
  ],
};

const buildRunner = (zone: string, title: string): RunnerData => {
  const texts = ITEMS_BY_ZONE[zone] ?? ITEMS_BY_ZONE['Кухня'];
  return { title, zone, items: texts.map((text, i) => ({ id: i + 1, text })) };
};

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'active', label: 'Активные', icon: 'ClipboardList' },
  { id: 'done', label: 'Завершённые', icon: 'CheckCheck' },
  { id: 'templates', label: 'Шаблоны', icon: 'LayoutTemplate' },
  { id: 'stats', label: 'Статистика', icon: 'BarChart3' },
];

const activeChecks = [
  { id: 1, zone: 'Кухня', title: 'Чек-лист кухни', done: 9, total: 14, by: 'А. Соколов', time: 'сегодня, 09:14', issues: 1 },
  { id: 2, zone: 'Бар', title: 'Чек-лист бара', done: 5, total: 12, by: 'И. Чен', time: 'сегодня, 09:40', issues: 0 },
  { id: 3, zone: 'Кондитер', title: 'Чек-лист кондитера', done: 3, total: 12, by: 'О. Смирнова', time: 'сегодня, 10:05', issues: 2 },
];

const doneChecks = [
  { id: 4, zone: 'Стандарты', title: 'Чек-лист стандартов', score: 100, by: 'М. Левина', time: 'вчера, 22:10' },
  { id: 5, zone: 'Оценка напитков', title: 'Оценка качества напитков', score: 92, by: 'И. Чен', time: 'вчера, 18:20' },
  { id: 6, zone: 'Кухня', title: 'Чек-лист кухни', score: 86, by: 'А. Соколов', time: 'вчера, 08:50' },
];

const templates = [
  { id: 1, zone: 'Бар', title: 'Чек-лист бара', items: 12, icon: 'Wine', color: '280 30% 50%' },
  { id: 2, zone: 'Кухня', title: 'Чек-лист кухни', items: 14, icon: 'CookingPot', color: '16 45% 48%' },
  { id: 3, zone: 'Кондитер', title: 'Чек-лист кондитера', items: 12, icon: 'Cake', color: '340 40% 55%' },
  { id: 4, zone: 'Стандарты', title: 'Чек-лист стандартов', items: 13, icon: 'BadgeCheck', color: '200 40% 45%' },
  { id: 5, zone: 'Оценка напитков', title: 'Оценка качества напитков', items: 13, icon: 'GlassWater', color: '170 40% 42%' },
];

const stats = [
  { label: 'Проверок за месяц', value: '148', sub: '+12% к прошлому', icon: 'TrendingUp' },
  { label: 'Средний балл', value: '91%', sub: 'по всем зонам', icon: 'Gauge' },
  { label: 'Открытых нарушений', value: '7', sub: '3 критичных', icon: 'TriangleAlert' },
  { label: 'Фото-фиксаций', value: '34', sub: 'за неделю', icon: 'Camera' },
];

const zoneScores = [
  { zone: 'Бар', score: 96 },
  { zone: 'Кухня', score: 91 },
  { zone: 'Кондитер', score: 84 },
  { zone: 'Стандарты', score: 97 },
  { zone: 'Оценка напитков', score: 89 },
];

const Index = () => {
  const [tab, setTab] = useState<Tab>('active');
  const [runner, setRunner] = useState<RunnerData | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {runner && <ChecklistRunner data={runner} onClose={() => setRunner(null)} />}
      {/* Header */}
      <header className="border-b border-border/60 sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://cdn.poehali.dev/projects/da861bac-1ea4-49ae-b39c-72c9841ade32/bucket/0587e8cf-1680-4a82-baf6-adff85516944.png"
              alt="ICONFOOD"
              className="h-8 w-auto object-contain"
            />
            <div className="leading-tight hidden sm:block">
              <p className="font-semibold text-sm tracking-tight">Контроль качества</p>
              <p className="text-[11px] text-muted-foreground">Ресторанный холдинг ICONFOOD</p>
            </div>
          </div>
          <Button
            className="rounded-full gap-2 h-10 px-5 shadow-sm"
            onClick={() => setRunner(buildRunner('Кухня', 'Чек-лист кухни'))}
          >
            <Icon name="Plus" size={16} />
            Новая проверка
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {/* Hero */}
        <div className="mb-10 animate-fade-in">
          <p className="text-primary text-sm font-medium mb-2">Сегодня · 29 июня</p>
          <h1 className="font-display text-5xl sm:text-6xl font-medium tracking-tight leading-[1.05]">
            Чистота и порядок —<br />под контролем.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-md">
            Проводите проверки по зонам, фиксируйте нарушения фотографиями и следите за качеством в реальном времени.
          </p>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1.5 p-1.5 bg-secondary/60 rounded-2xl w-fit mb-8 overflow-x-auto">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === n.id
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={n.icon} size={16} />
              {n.label}
            </button>
          ))}
        </nav>

        {/* Active */}
        {tab === 'active' && (
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
        )}

        {/* Done */}
        {tab === 'done' && (
          <div className="grid gap-4 animate-scale-in">
            {doneChecks.map((c) => (
              <div key={c.id} className="bg-card border border-border/70 rounded-3xl p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-semibold tabular-nums ${
                    c.score >= 90 ? 'bg-accent text-accent-foreground' : c.score >= 80 ? 'bg-secondary text-secondary-foreground' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {c.score}
                  </div>
                  <div>
                    <Badge variant="secondary" className="rounded-full font-normal mb-1">{c.zone}</Badge>
                    <h3 className="font-semibold tracking-tight">{c.title}</h3>
                    <p className="text-sm text-muted-foreground">{c.by} · {c.time}</p>
                  </div>
                </div>
                <Icon name="CircleCheck" size={22} className="text-primary shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Templates */}
        {tab === 'templates' && (
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
        )}

        {/* Stats */}
        {tab === 'stats' && (
          <div className="animate-scale-in space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-card border border-border/70 rounded-3xl p-5">
                  <Icon name={s.icon} size={20} className="text-primary mb-3" />
                  <p className="text-3xl font-semibold tracking-tight tabular-nums">{s.value}</p>
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
                    <span className="text-sm w-20 shrink-0">{z.zone}</span>
                    <Progress value={z.score} className="h-2.5" />
                    <span className="text-sm font-medium tabular-nums w-10 text-right">{z.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-5 sm:px-8 py-8 text-center text-xs text-muted-foreground">
        Ресторанный холдинг ICONFOOD · Контроль качества
      </footer>
    </div>
  );
};

export default Index;