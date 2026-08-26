import { CompletedCheck } from '@/components/ChecklistRunner';

const QUEUE_KEY = 'pending_completed_checks';

export const getQueue = (): CompletedCheck[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveQueue = (queue: CompletedCheck[]) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* хранилище переполнено — пропускаем */ }
};

export const addToQueue = (check: CompletedCheck) => {
  const queue = getQueue();
  const idx = queue.findIndex((c) => c.id === check.id);
  if (idx >= 0) queue[idx] = check;
  else queue.push(check);
  saveQueue(queue);
};

export const removeFromQueue = (id: number) => {
  const queue = getQueue().filter((c) => c.id !== id);
  saveQueue(queue);
};
