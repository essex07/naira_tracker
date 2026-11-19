"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteEntryAction } from "@/app/(app)/dashboard/actions";
import type { TransactionKind } from "@/lib/types";

export function DeleteEntryButton({
  kind,
  id,
  label,
}: {
  kind: TransactionKind;
  id: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete “${label}”?\n\nThis also updates the category, weekly and total balances. It cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteEntryAction(kind, id);

      if (result.status === "error") {
        window.alert(result.message ?? "Could not delete this entry.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted/55 transition hover:bg-danger-soft hover:text-danger disabled:cursor-wait disabled:opacity-50"
      aria-label={`Delete ${label}`}
      title="Delete entry"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="size-3.5" aria-hidden="true" />
      )}
    </button>
  );
}
