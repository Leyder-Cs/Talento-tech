interface QtyStepperProps {
  value: number;
  min?: number;
  onChange: (value: number) => void;
}

export function QtyStepper({ value, min = 1, onChange }: QtyStepperProps) {
  return (
    <div className="flex items-center border border-white/10 rounded-lg">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="px-2.5 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
      >
        −
      </button>
      <span className="px-3 py-1.5 font-medium text-white text-sm min-w-[2.5rem] text-center tabular-nums">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="px-2.5 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
      >
        +
      </button>
    </div>
  );
}
