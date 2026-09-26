import { useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

/**
 * Inline click-to-edit wrapper for a single memo field. Only rendered by
 * callers when the field is on the server's editable whitelist and the
 * data came from live research (edits persist server-side per company —
 * see server/services/editsStore.js — so there's nowhere to save an edit
 * to for mock/demo data).
 */
export default function EditableField({ value, edited, multiline = false, onSave, children }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <span className="group/edit inline-flex items-start gap-1.5">
        {children}
        {edited && (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-accent-soft bg-accent/10 border border-accent/25 rounded px-1 py-0.5 shrink-0 self-center">
            edited
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            setDraft(value ?? '');
            setEditing(true);
          }}
          className="opacity-0 group-hover/edit:opacity-100 text-text-faint hover:text-accent-soft transition-opacity shrink-0 self-center"
          title="Edit"
        >
          <Pencil size={11} />
        </button>
      </span>
    );
  }

  const Field = multiline ? 'textarea' : 'input';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <Field
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={multiline ? 4 : undefined}
        className="w-full bg-panel-alt border border-accent/40 rounded-md px-2 py-1.5 text-[inherit] text-text outline-none focus:border-accent"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave(draft);
              setEditing(false);
            } finally {
              setSaving(false);
            }
          }}
          className="flex items-center gap-1 text-[11px] font-semibold text-positive hover:underline disabled:opacity-50"
        >
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
          Save
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => setEditing(false)}
          className="flex items-center gap-1 text-[11px] text-text-faint hover:text-text-muted"
        >
          <X size={11} />
          Cancel
        </button>
      </div>
    </div>
  );
}
