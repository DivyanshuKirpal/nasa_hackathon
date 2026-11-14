export function AppFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-100">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <p>
          Prototype for the NASA Space Apps Challenge. Not a medical device.
        </p>
        {/* Opens the demo panel from milestone M4; does nothing yet. */}
        <button
          type="button"
          className="min-h-11 min-w-11 rounded px-3 text-slate-700 underline underline-offset-4 hover:text-slate-900"
        >
          Presenter tools
        </button>
      </div>
    </footer>
  )
}
