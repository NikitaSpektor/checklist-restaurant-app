import { useRef, useState, useEffect } from 'react';
import TastingSetupScreen from './tasting-runner/TastingSetupScreen';
import TastingItemsScreen from './tasting-runner/TastingItemsScreen';
import TastingReportScreen from './tasting-runner/TastingReportScreen';
import { compressFiles } from '@/lib/imageCompress';
import {
  DishRow,
  emptyDishRow,
  parseAssignee,
  monthYearFromDate,
  dishHasIssue,
  tastingOverallAverage,
  CompletedCheck,
} from './checklist-runner/types';
import { TASTING_TITLE, TASTING_ZONE } from '@/data/checklistData';

const DISH_COUNT_DEFAULT = 7;
const DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000;

interface TastingDraft {
  lastName: string;
  firstName: string;
  checkDate: string;
  seatingPercent: string;
  restaurant: string;
  participants: string;
  started: boolean;
  dishes: DishRow[];
  otherComments: string;
  receiptPhotos: string[];
  savedAt: number;
}

const getDraftKey = (editingId?: number) => `tasting_draft::${editingId ?? 'new'}`;

const loadDraft = (key: string): TastingDraft | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as TastingDraft;
    if (!draft.savedAt || Date.now() - draft.savedAt > DRAFT_TTL_MS) return null;
    return draft;
  } catch {
    return null;
  }
};

const saveDraft = (key: string, draft: Omit<TastingDraft, 'savedAt'>) => {
  try {
    localStorage.setItem(key, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch { /* хранилище переполнено */ }
};

const clearDraft = (key: string) => {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
};

const todayIso = () => new Date().toISOString().slice(0, 10);

interface TastingRunnerProps {
  onClose: () => void;
  onComplete?: (c: CompletedCheck) => void;
  editingCheck?: CompletedCheck;
  title?: string;
}

const TastingRunner = ({ onClose, onComplete, editingCheck, title }: TastingRunnerProps) => {
  const listTitle = editingCheck?.title || title || TASTING_TITLE;
  const draftKey = getDraftKey(editingCheck?.id);
  const draft = loadDraft(draftKey);
  const initialAssignee = parseAssignee(editingCheck?.by);

  const [lastName, setLastName] = useState(draft?.lastName ?? initialAssignee.lastName);
  const [firstName, setFirstName] = useState(draft?.firstName ?? initialAssignee.firstName);
  const [checkDate, setCheckDate] = useState(draft?.checkDate ?? editingCheck?.checkDate ?? todayIso());
  const [seatingPercent, setSeatingPercent] = useState(draft?.seatingPercent ?? (editingCheck?.seatingPercent != null ? String(editingCheck.seatingPercent) : ''));
  const [restaurant, setRestaurant] = useState(draft?.restaurant ?? editingCheck?.restaurant ?? '');
  const [participants, setParticipants] = useState(draft?.participants ?? editingCheck?.participants ?? '');
  const [started, setStarted] = useState(draft?.started ?? false);
  const [finished, setFinished] = useState(false);
  const [otherComments, setOtherComments] = useState(draft?.otherComments ?? editingCheck?.otherComments ?? '');
  const [dishes, setDishes] = useState<DishRow[]>(() => {
    if (draft?.dishes?.length) return draft.dishes;
    if (editingCheck?.dishes?.length) return editingCheck.dishes;
    return Array.from({ length: DISH_COUNT_DEFAULT }, (_, i) => emptyDishRow(i + 1));
  });
  const [receiptPhotos, setReceiptPhotos] = useState<string[]>(draft?.receiptPhotos ?? editingCheck?.receiptPhotos ?? []);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const receiptFileRef = useRef<HTMLInputElement | null>(null);

  const finalAssignee = `${lastName} ${firstName}`.trim();
  const canStart = Boolean(lastName.trim() && firstName.trim() && restaurant && checkDate);

  useEffect(() => {
    if (finished) return;
    saveDraft(draftKey, { lastName, firstName, checkDate, seatingPercent, restaurant, participants, started, dishes, otherComments, receiptPhotos });
  }, [draftKey, lastName, firstName, checkDate, seatingPercent, restaurant, participants, started, dishes, otherComments, receiptPhotos, finished]);

  const setDish = (id: number, patch: Partial<DishRow>) =>
    setDishes((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addDish = () =>
    setDishes((rows) => [...rows, emptyDishRow((rows.at(-1)?.id ?? 0) + 1)]);

  const removeDish = (id: number) =>
    setDishes((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));

  const onFile = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const compressed = await compressFiles(files);
    setDishes((rows) => rows.map((r) => (r.id === id ? { ...r, photos: [...r.photos, ...compressed] } : r)));
    e.target.value = '';
  };

  const removePhoto = (id: number, index: number) =>
    setDishes((rows) => rows.map((r) => (r.id === id ? { ...r, photos: r.photos.filter((_, i) => i !== index) } : r)));

  const onReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const compressed = await compressFiles(files);
    setReceiptPhotos((prev) => [...prev, ...compressed]);
    e.target.value = '';
  };

  const removeReceiptPhoto = (index: number) =>
    setReceiptPhotos((prev) => prev.filter((_, i) => i !== index));

  const handleFinish = () => {
    setFinished(true);
    clearDraft(draftKey);
    const filledDishes = dishes.filter((d) => d.name.trim());
    const issues = filledDishes.filter((d) => dishHasIssue(d)).length;
    const overallAverage = tastingOverallAverage(filledDishes);
    const score = overallAverage != null ? Math.max(1, parseFloat(overallAverage.toFixed(2))) : 5;
    onComplete?.({
      id: editingCheck?.id ?? Date.now(),
      title: listTitle,
      zone: TASTING_ZONE,
      score,
      by: finalAssignee,
      restaurant,
      month: monthYearFromDate(checkDate),
      time: editingCheck?.time ?? new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
      issues,
      okCount: filledDishes.length - issues,
      totalCount: filledDishes.length,
      kind: 'tasting',
      seatingPercent: seatingPercent ? Number(seatingPercent) : undefined,
      checkDate,
      dishes: filledDishes,
      otherComments: otherComments || undefined,
      participants: participants || undefined,
      receiptPhotos: receiptPhotos.length ? receiptPhotos : undefined,
    });
  };

  if (!started) {
    return (
      <TastingSetupScreen
        title={listTitle}
        onClose={onClose}
        lastName={lastName}
        setLastName={setLastName}
        firstName={firstName}
        setFirstName={setFirstName}
        checkDate={checkDate}
        setCheckDate={setCheckDate}
        seatingPercent={seatingPercent}
        setSeatingPercent={setSeatingPercent}
        restaurant={restaurant}
        setRestaurant={setRestaurant}
        participants={participants}
        setParticipants={setParticipants}
        canStart={canStart}
        finalAssignee={finalAssignee}
        onStart={() => setStarted(true)}
        isEditing={Boolean(editingCheck)}
      />
    );
  }

  if (finished) {
    return (
      <TastingReportScreen
        title={listTitle}
        onClose={onClose}
        finalAssignee={finalAssignee}
        checkDate={checkDate}
        restaurant={restaurant}
        seatingPercent={seatingPercent}
        dishes={dishes}
        otherComments={otherComments}
        participants={participants}
        receiptPhotos={receiptPhotos}
        time={editingCheck?.time ?? new Date().toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
      />
    );
  }

  return (
    <TastingItemsScreen
      title={listTitle}
      onClose={onClose}
      finalAssignee={finalAssignee}
      checkDate={checkDate}
      restaurant={restaurant}
      dishes={dishes}
      setDish={setDish}
      addDish={addDish}
      removeDish={removeDish}
      otherComments={otherComments}
      setOtherComments={setOtherComments}
      fileRefs={fileRefs}
      onFile={onFile}
      removePhoto={removePhoto}
      receiptPhotos={receiptPhotos}
      receiptFileRef={receiptFileRef}
      onReceiptFile={onReceiptFile}
      removeReceiptPhoto={removeReceiptPhoto}
      onFinish={handleFinish}
      isEditing={Boolean(editingCheck)}
    />
  );
};

export default TastingRunner;