"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitReceipt } from "@/app/(dashboard)/group/[groupId]/contribute/action";

const MAX_FILE_SIZE = 1 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];

export function ReceiptUploadForm({
  groupId,
  contributionId,
}: {
  groupId: string;
  contributionId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("upload a JPG, PNG, WEBP, or PDF file.");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("file must be under 1MB.");
      return;
    }
    setFile(selected);
  }

  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file first.");
      return;
    }

    setLoading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `${groupId}/${contributionId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(path, file, { upsert: true });

      if (uploadError) {
        setLoading(false);
        setError(uploadError.message);
        return;
      }

      const result = await submitReceipt(contributionId, path);

      setLoading(false);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="receipt" className="text-sm font-medium text-neutral-700">
          Upload proof of payment
        </label>
        <input
          id="receipt"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-green-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-green-800"
        />
        <p className="mt-1 text-xs text-neutral-400">JPG, PNG, WEBP, or PDF — max 5MB</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !file}
        className="w-full rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-60"
      >
        {loading ? "Uploading..." : "Submit receipt"}
      </button>
    </form>
  )
}