import { CompletedCheck } from '@/components/ChecklistRunner';

const QUEUE_KEY = 'pending_completed_checks';
export const QUEUE_CHANGED_EVENT = 'pending-queue-changed';
export const CHECKS_URL = 'https://functions.poehali.dev/55af8c36-e1fb-42d6-97d4-ae006e9cd3f2';

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
  window.dispatchEvent(new CustomEvent(QUEUE_CHANGED_EVENT));
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

export const sendCheckToServer = async (toSave: CompletedCheck) => {
  const res = await fetch(CHECKS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toSave),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};