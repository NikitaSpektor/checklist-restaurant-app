import Icon from '@/components/ui/icon';
import { usePendingQueue } from '@/hooks/usePendingQueue';

interface PendingQueueBadgeProps {
  className?: string;
}

const PendingQueueBadge = ({ className = '' }: PendingQueueBadgeProps) => {
  const { pendingCount, retrying, flushQueue } = usePendingQueue();

  if (pendingCount === 0) return null;

  return (
    <button
      onClick={flushQueue}
      disabled={retrying}
      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 h-8 rounded-full bg-amber-500/15 text-amber-600 text-xs font-medium hover:bg-amber-500/25 transition-colors disabled:opacity-60 shrink-0 ${className}`}
      title="Есть проверки, не отправленные на сервер. Нажмите, чтобы повторить отправку"
    >
      <Icon name={retrying ? 'Loader' : 'CloudOff'} size={14} className={retrying ? 'animate-spin' : ''} />
      <span className="hidden sm:inline">{retrying ? 'Отправляем…' : `Не отправлено: ${pendingCount}`}</span>
      <span className="sm:hidden">{pendingCount}</span>
    </button>
  );
};

export default PendingQueueBadge;
