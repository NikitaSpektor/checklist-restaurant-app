interface ScoreScaleProps {
  value: number | null;
  onChange: (v: number) => void;
}

const SCORE_COLORS: Record<number, string> = {
  1: 'bg-destructive text-destructive-foreground border-destructive',
  2: 'bg-destructive/70 text-destructive-foreground border-destructive/70',
  3: 'bg-amber-500 text-white border-amber-500',
  4: 'bg-primary/70 text-primary-foreground border-primary/70',
  5: 'bg-primary text-primary-foreground border-primary',
};

const ScoreScale = ({ value, onChange }: ScoreScaleProps) => {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-all ${
            value === n ? SCORE_COLORS[n] : 'bg-background text-muted-foreground border-border/70 hover:border-primary/40'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
};

export default ScoreScale;
