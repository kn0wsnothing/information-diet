"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GoodreadsConnectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError("");
    } else {
      setFile(null);
      setError("Please select a CSV file");
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a CSV file");
      return;
    }

    setIsImporting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", "goodreads");

      const response = await fetch("/app/api/import/goodreads", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Import failed");
      } else {
        setSuccessCount(result.imported || 0);
        setTimeout(() => {
          router.push("/app");
        }, 2000);
      }
    } catch (err) {
      setError("Failed to import file");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-xl px-6 py-12">
        <div className="mb-8">
          <Link href="/app/add" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← Back to add content
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Connect Goodreads
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Import your reading list from Goodreads to track your books in Information Diet.
        </p>

        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-medium text-zinc-900 mb-2">Export your Goodreads data</h2>
            <ol className="text-sm text-zinc-600 space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://www.goodreads.com/review/import" target="_blank" className="text-blue-600 underline">Goodreads Import/Export</a></li>
              <li>Click "Export library"</li>
              <li>Save the CSV file</li>
              <li>Upload it below</li>
            </ol>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-medium text-zinc-900 mb-4">Upload your CSV</h2>
            <div className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-200"
              />
              
              {file && (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <span className="text-zinc-900">Selected:</span>
                  <span>{file.name}</span>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!file || isImporting}
                className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? "Importing..." : "Import books"}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {successCount > 0 && (
              <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                Successfully imported {successCount} books! Redirecting...
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="text-sm font-medium text-zinc-900 mb-2">What we'll import:</h3>
            <ul className="text-xs text-zinc-600 space-y-1">
              <li>• Your "to-read" shelf (as queued books)</li>
              <li>• Currently reading books (as in-progress)</li>
              <li>• Completed books (as read items with time estimates)</li>
              <li>• Book metadata (title, author, page count, etc.)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
