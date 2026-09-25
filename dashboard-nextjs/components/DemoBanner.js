'use client';

export default function DemoBanner({ onReset }) {
  return (
    <div className="bg-blueprint-900 text-white text-sm px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="font-medium">Demo with fictional data.</span>
      <span className="text-white/70">
        Companies and applications are made up. Changes are saved only in your browser.
      </span>
      <button
        onClick={onReset}
        className="ml-auto underline underline-offset-2 text-white/90 hover:text-white"
      >
        Reset demo
      </button>
    </div>
  );
}
