import { useRef, useState } from 'react';
import ChecklistSetupScreen from './checklist-runner/ChecklistSetupScreen';
import ChecklistItemsScreen from './checklist-runner/ChecklistItemsScreen';
import ChecklistReportScreen from './checklist-runner/ChecklistReportScreen';
import {
  RunnerData,
  CompletedCheck,
  ItemState,
  getFine,
  parseMonthYear,
  parseAssignee,
} from './checklist-runner/types';

export type {
  ChecklistItem,
  RunnerData,
  CompletedCheckItem,
  EditHistoryEntry,
  CompletedCheck,
} from './checklist-runner/types';

const ChecklistRunner = ({ data, onClose, onComplete, editingCheck }: { data: RunnerData; onClose: () => void; onComplete?: (c: CompletedCheck) => void; editingCheck?: CompletedCheck }) => {
  const initialAssignee = parseAssignee(editingCheck?.by);
  const initialMonthYear = parseMonthYear(editingCheck?.month);
  const [lastName, setLastName] = useState(initialAssignee.lastName);
  const [firstName, setFirstName] = useState(initialAssignee.firstName);
  const [month, setMonth] = useState(initialMonthYear.month);
  const [year, setYear] = useState(initialMonthYear.year);
  const [restaurant, setRestaurant] = useState(editingCheck?.restaurant ?? '');
  const [waiterName, setWaiterName] = useState(editingCheck?.waiter ?? '');
  const [started, setStarted] = useState(false);
  const [states, setStates] = useState<Record<number, ItemState>>(() => {
    if (editingCheck?.itemsDetail) {
      const bySection = new Map(editingCheck.itemsDetail.map((i) => [i.id, i]));
      return Object.fromEntries(
        data.items.map((i) => {
          const saved = bySection.get(i.id);
          const photos = saved?.photos ?? (saved?.photo ? [saved.photo] : []);
          return [i.id, { status: saved?.status ?? 'pending', comment: saved?.comment ?? '', photos }];
        })
      );
    }
    return Object.fromEntries(data.items.map((i) => [i.id, { status: 'pending', comment: '', photos: [] }]));
  });
  const isGuestService = data.zone === 'Обслуживание гостей';
  const finalAssignee = `${lastName} ${firstName}`.trim();
  const canStart = lastName.trim() && firstName.trim() && restaurant && (!isGuestService || waiterName.trim());
  const [finished, setFinished] = useState(false);
  const [finesDistribution, setFinesDistribution] = useState(editingCheck?.finesDistribution ?? '');
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const set = (id: number, patch: Partial<ItemState>) =>
    setStates((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const checked = data.items.filter((i) => states[i.id].status !== 'pending').length;
  const okCount = data.items.filter((i) => states[i.id].status === 'ok').length;
  const issues = data.items.filter((i) => states[i.id].status === 'issue' || states[i.id].status === 'issue_no_fine').length;
  const naCount = data.items.filter((i) => states[i.id].status === 'na').length;
  const isStandards = data.zone === 'Стандарты';
  // «Неактуально» считается как «Зачёт» — исключаем из знаменателя для зоны Стандарты
  const scoreBase = isStandards ? data.items.length - naCount : data.items.length;
  const score = scoreBase > 0
    ? Math.max(1, parseFloat((5 - (issues / scoreBase) * 4).toFixed(2)))
    : 5;
  const isKitchen = data.zone === 'Кухня';
  const isPastry = data.zone === 'Кондитер';
  const isBar = data.zone === 'Бар';
  const isDrinks = data.zone === 'Оценка напитков';
  const hasFines = isStandards || isKitchen || isPastry || isBar || isGuestService || isDrinks;
  const totalFine = hasFines
    ? data.items
        .filter((i) => states[i.id].status === 'issue')
        .reduce((sum, i) => sum + (i.fine ?? (isStandards ? getFine(i.section) : 0)), 0)
    : 0;

  const compressImage = (file: File, maxDim = 1600, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(reader.result as string); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(reader.result as string);
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onFile = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const compressed = await Promise.all(
      files.map((file) =>
        compressImage(file).catch(
          () =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      )
    );
    setStates((s) => ({ ...s, [id]: { ...s[id], photos: [...s[id].photos, ...compressed] } }));
    e.target.value = '';
  };

  const removePhoto = (id: number, index: number) => {
    setStates((s) => ({ ...s, [id]: { ...s[id], photos: s[id].photos.filter((_, i) => i !== index) } }));
  };

  // Экран заполнения данных перед проверкой
  if (!started) {
    return (
      <ChecklistSetupScreen
        data={data}
        editingCheck={editingCheck}
        onClose={onClose}
        lastName={lastName}
        setLastName={setLastName}
        firstName={firstName}
        setFirstName={setFirstName}
        isGuestService={isGuestService}
        waiterName={waiterName}
        setWaiterName={setWaiterName}
        year={year}
        setYear={setYear}
        month={month}
        setMonth={setMonth}
        restaurant={restaurant}
        setRestaurant={setRestaurant}
        canStart={canStart}
        finalAssignee={finalAssignee}
        onStart={() => setStarted(true)}
      />
    );
  }

  if (finished) {
    return (
      <ChecklistReportScreen
        data={data}
        onClose={onClose}
        states={states}
        restaurant={restaurant}
        month={month}
        year={year}
        finalAssignee={finalAssignee}
        waiterName={waiterName}
        isGuestService={isGuestService}
        score={score}
        okCount={okCount}
        issues={issues}
        naCount={naCount}
        hasFines={hasFines}
        totalFine={totalFine}
        isStandards={isStandards}
        isKitchen={isKitchen}
        isPastry={isPastry}
        isBar={isBar}
        isDrinks={isDrinks}
        finesDistribution={finesDistribution}
        setFinesDistribution={setFinesDistribution}
      />
    );
  }

  return (
    <ChecklistItemsScreen
      data={data}
      onClose={onClose}
      finalAssignee={finalAssignee}
      month={month}
      year={year}
      restaurant={restaurant}
      checked={checked}
      states={states}
      set={set}
      hasFines={hasFines}
      isStandards={isStandards}
      okCount={okCount}
      issues={issues}
      score={score}
      totalFine={totalFine}
      fileRefs={fileRefs}
      onFile={onFile}
      removePhoto={removePhoto}
      editingCheck={editingCheck}
      isGuestService={isGuestService}
      waiterName={waiterName}
      isBar={isBar}
      isKitchen={isKitchen}
      isPastry={isPastry}
      finesDistribution={finesDistribution}
      onComplete={onComplete}
      setFinished={setFinished}
    />
  );
};

export default ChecklistRunner;
