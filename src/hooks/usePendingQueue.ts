import { useCallback, useEffect, useState } from 'react';
import { getQueue, removeFromQueue, sendCheckToServer, QUEUE_CHANGED_EVENT } from '@/lib/offlineQueue';

export const usePendingQueue = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const flushQueue = useCallback(async () => {
    setRetrying(true);
    const queue = getQueue();
    for (const check of queue) {
      try {
        await sendCheckToServer(check);
        removeFromQueue(check.id);
      } catch {
        // остаётся в очереди — попробуем при следующем восстановлении сети
      }
    }
    setRetrying(false);
  }, []);

  useEffect(() => {
    const updateCount = () => setPendingCount(getQueue().length);
    updateCount();
    flushQueue();
    window.addEventListener('online', flushQueue);
    window.addEventListener(QUEUE_CHANGED_EVENT, updateCount);
    return () => {
      window.removeEventListener('online', flushQueue);
      window.removeEventListener(QUEUE_CHANGED_EVENT, updateCount);
    };
  }, [flushQueue]);

  return { pendingCount, retrying, flushQueue };
};
