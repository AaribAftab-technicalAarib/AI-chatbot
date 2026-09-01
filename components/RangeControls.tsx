"use client";

import { useState, type ChangeEvent } from "react";
import { cn } from "@/lib/cn";

type NumberFieldProps = {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  label: string;
  disabled?: boolean;
};

function NumberField({ value, onChange, step = 1, label, disabled }: NumberFieldProps) {
  const [text, setText] = useState<string>(String(value));
  const [focused, setFocused] = useState(false);

  if (!focused && Number(text) !== value) {
    setText(String(value));
  }

  function commit(raw: string) {
    const n = Number(raw);
    if (Number.isFinite(n)) onChange(n);
    else setText(String(value));
  }

  return (
    <label className="flex flex-col text-xs text-muted">
      <span className="mb-1">{label}</span>
      <input
        type="number"
        step={step}
        value={text}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          commit(e.target.value);
        }}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-24 rounded-md border border-border bg-bg/60 px-2 py-1 text-sm text-fg"
      />
    </label>
  );
}

type Props = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  autoY: boolean;
  onXMin: (n: number) => void;
  onXMax: (n: number) => void;
  onYMin: (n: number) => void;
  onYMax: (n: number) => void;
  onToggleAutoY: (b: boolean) => void;
};

export function RangeControls(props: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <NumberField label="x min" value={props.xMin} onChange={props.onXMin} step={0.5} />
      <NumberField label="x max" value={props.xMax} onChange={props.onXMax} step={0.5} />
      <div className="flex items-end gap-2">
        <NumberField label="y min" value={props.yMin} onChange={props.onYMin} step={0.5} disabled={props.autoY} />
        <NumberField label="y max" value={props.yMax} onChange={props.onYMax} step={0.5} disabled={props.autoY} />
      </div>
      <label className="ml-1 flex cursor-pointer items-center gap-2 text-sm text-fg/80">
        <input
          type="checkbox"
          checked={props.autoY}
          onChange={(e) => props.onToggleAutoY(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-[rgb(var(--accent))]"
        />
        Auto Y
      </label>
    </div>
  );
}
