import { useState, useMemo, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import ChecklistRunner, { RunnerData, CompletedCheck } from '@/components/ChecklistRunner';
import CompletedCheckViewer from '@/components/CompletedCheckViewer';
import ActiveTab from '@/components/index-tabs/ActiveTab';
import DoneTab from '@/components/index-tabs/DoneTab';
import TemplatesTab from '@/components/index-tabs/TemplatesTab';
import StatsTab from '@/components/index-tabs/StatsTab';
import { Tab, NAV, ZONES, buildRunnerFromCompleted } from '@/data/checklistData';

const CHECKS_URL = 'https://functions.poehali.dev/55af8c36-e1fb-42d6-97d4-ae006e9cd3f2';
const UPLOAD_URL = 'https://functions.poehali.dev/28ba2203-7a14-4242-9412-4c6aff414ec8';

const uploadPhoto = async (base64: string): Promise<string | null> => {
  try {
    const res = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: base64 }),
    });
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
};

const Index = () => {
  const [tab, setTab] = useState<Tab>('templates');
  const [runner, setRunner] = useState<RunnerData | null>(null);
  const [editingCheck, setEditingCheck] = useState<CompletedCheck | null>(null);
  const [viewingCheck, setViewingCheck] = useState<CompletedCheck | null>(null);
  const [completed, setCompleted] = useState<CompletedCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChecks = useCallback(async () => {
    try {
      const res = await fetch(CHECKS_URL);
      const raw = await res.json();
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      setCompleted(Array.isArray(data) ? data : []);
    } catch {
      try {
        const saved = localStorage.getItem('completed_checks');
        if (saved) setCompleted(JSON.parse(saved));
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChecks(); }, [fetchChecks]);

  const [statsRestaurant, setStatsRestaurant] = useState<string>('all');
  const [statsZone, setStatsZone] = useState<string>('all');
  const [statsPeriod, setStatsPeriod] = useState<string>('all');
  const [doneZoneFilter, setDoneZoneFilter] = useState<string>('all');
  const [doneMonthFilter, setDoneMonthFilter] = useState<string>('all');

  const doneZones = useMemo(() => {
    const set = new Set(completed.map((c) => c.zone).filter(Boolean));
    return Array.from(set).sort();
  }, [completed]);

  const doneMonths = useMemo(() => {
    const set = new Set(completed.map((c) => c.month).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [completed]);

  const filteredDone = useMemo(() => {
    return completed.filter((c) => {
      if (doneZoneFilter !== 'all' && c.zone !== doneZoneFilter) return false;
      if (doneMonthFilter !== 'all' && c.month !== doneMonthFilter) return false;
      return true;
    });
  }, [completed, doneZoneFilter, doneMonthFilter]);

  const restaurants = useMemo(() => {
    const set = new Set(completed.map((c) => c.restaurant).filter(Boolean));
    return Array.from(set).sort();
  }, [completed]);

  const periods = useMemo(() => {
    const set = new Set(completed.map((c) => c.month).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [completed]);

  const filteredCompleted = useMemo(() => {
    return completed.filter((c) => {
      if (statsRestaurant !== 'all' && c.restaurant !== statsRestaurant) return false;
      if (statsZone !== 'all' && c.zone !== statsZone) return false;
      if (statsPeriod !== 'all' && c.month !== statsPeriod) return false;
      return true;
    });
  }, [completed, statsRestaurant, statsZone, statsPeriod]);

  const stats = useMemo(() => {
    const total = filteredCompleted.length;
    const avgScore = total
      ? Math.round((filteredCompleted.reduce((s, c) => s + c.score, 0) / total) * 20)
      : null;
    const totalIssues = filteredCompleted.reduce((s, c) => s + (c.issues ?? 0), 0);
    return [
      { label: 'Проверок всего', value: String(total), sub: total ? 'завершено' : 'нет данных', icon: 'TrendingUp' },
      { label: 'Средний балл', value: avgScore != null ? `${avgScore}%` : '—', sub: 'по всем зонам', icon: 'Gauge' },
      { label: 'Открытых нарушений', value: String(totalIssues), sub: totalIssues ? `из ${total} проверок` : 'нет данных', icon: 'TriangleAlert' },
      { label: 'Фото-фиксаций', value: '0', sub: 'за неделю', icon: 'Camera' },
    ];
  }, [filteredCompleted]);

  const zoneScores = useMemo(() => ZONES.map((zone) => {
    const checks = filteredCompleted.filter((c) => c.zone === zone);
    const score = checks.length
      ? Math.round((checks.reduce((s, c) => s + c.score, 0) / checks.length) * 20)
      : 0;
    return { zone, score };
  }), [filteredCompleted]);

  const handleComplete = async (c: CompletedCheck) => {
    setCompleted((prev) => {
      const exists = prev.some((x) => x.id === c.id);
      return exists ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev];
    });
    setEditingCheck(null);
    try {
      // Загружаем base64-фото в S3 перед сохранением в БД — хранить base64 в БД нельзя (слишком тяжёлые)
      const itemsDetail = c.itemsDetail
        ? await Promise.all(
            c.itemsDetail.map(async (item) => {
              const photos = item.photos
                ? await Promise.all(
                    item.photos.map((p) => (p.startsWith('data:') ? uploadPhoto(p) : Promise.resolve(p)))
                  )
                : undefined;
              const photo = item.photo?.startsWith('data:') ? await uploadPhoto(item.photo) : (item.photo ?? null);
              return { ...item, photo, photos: photos?.filter((p): p is string => Boolean(p)) };
            })
          )
        : undefined;
      const toSave = { ...c, itemsDetail };
      await fetch(CHECKS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      });
    } catch (e) { console.error('Failed to save check:', e); }
  };

  const handleEdit = (c: CompletedCheck) => {
    setEditingCheck(c);
    setRunner(buildRunnerFromCompleted(c));
  };

  const handleDelete = async (id: number) => {
    setCompleted((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`${CHECKS_URL}?id=${id}`, { method: 'DELETE' });
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {runner && (
        <ChecklistRunner
          data={runner}
          onClose={() => { setRunner(null); setEditingCheck(null); }}
          onComplete={handleComplete}
          editingCheck={editingCheck ?? undefined}
        />
      )}
      {viewingCheck && (
        <CompletedCheckViewer
          check={viewingCheck}
          onClose={() => setViewingCheck(null)}
          onEdit={(c) => { setViewingCheck(null); handleEdit(c); }}
        />
      )}
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

        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-14">
        {/* Hero */}
        <div className="mb-6 sm:mb-10 animate-fade-in">
          <p className="text-primary text-sm font-medium mb-2">Сегодня · {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.1]">
            Чистота и порядок —<br />под контролем.
          </h1>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base max-w-md">
            Проводите проверки по зонам, фиксируйте нарушения фотографиями и следите за качеством в реальном времени.
          </p>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-secondary/60 rounded-2xl w-full sm:w-fit mb-6 sm:mb-8 overflow-x-auto">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                tab === n.id
                  ? n.accent
                    ? 'bg-orange-500 shadow-sm text-white'
                    : 'bg-card shadow-sm text-foreground'
                  : n.accent
                    ? 'text-orange-500 hover:text-orange-600'
                    : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={n.icon} size={16} />
              {n.label}
            </button>
          ))}
        </nav>

        {/* Active */}
        {tab === 'active' && <ActiveTab setRunner={setRunner} />}

        {/* Done */}
        {tab === 'done' && (
          <DoneTab
            loading={loading}
            completed={completed}
            filteredDone={filteredDone}
            doneZones={doneZones}
            doneMonths={doneMonths}
            doneZoneFilter={doneZoneFilter}
            setDoneZoneFilter={setDoneZoneFilter}
            doneMonthFilter={doneMonthFilter}
            setDoneMonthFilter={setDoneMonthFilter}
            setViewingCheck={setViewingCheck}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        )}

        {/* Templates */}
        {tab === 'templates' && <TemplatesTab setRunner={setRunner} />}

        {/* Stats */}
        {tab === 'stats' && (
          <StatsTab
            restaurants={restaurants}
            statsRestaurant={statsRestaurant}
            setStatsRestaurant={setStatsRestaurant}
            statsZone={statsZone}
            setStatsZone={setStatsZone}
            periods={periods}
            statsPeriod={statsPeriod}
            setStatsPeriod={setStatsPeriod}
            stats={stats}
            zoneScores={zoneScores}
            filteredCompleted={filteredCompleted}
            setViewingCheck={setViewingCheck}
          />
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-5 sm:px-8 py-8 text-center text-xs text-muted-foreground">
        Ресторанный холдинг ICONFOOD · Контроль качества
      </footer>
    </div>
  );
};

export default Index;
