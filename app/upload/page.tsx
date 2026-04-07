// app/upload/page.tsx
// CSV Upload Page

"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface UploadResult {
  success: boolean;
  count?: number;
  format?: string;
  error?: string;
  errors?: Array<{ row: number; message: string }>;
}

export default function UploadPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setResult({ success: false, error: "Please upload a CSV file" });
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          count: data.count,
          format: data.format,
          errors: data.errors,
        });
      } else {
        setResult({
          success: false,
          error: data.error || "Failed to upload file",
          errors: data.errors,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload file",
      });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Upload Bank Statements</h1>
            <p className="text-muted-foreground">
              Drag and drop your CSV file or click to browse
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Supported Formats</CardTitle>
              <CardDescription>
                Works with exports from major banks and generic CSV files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Chase</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Bank of America</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Wells Fargo</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Citibank</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>American Express</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Generic CSV</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
              ${isUploading ? "pointer-events-none opacity-50" : ""}
            `}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg">Processing your file...</p>
              </div>
            ) : result?.success ? (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <div className="text-center">
                  <p className="text-lg font-semibold">Upload Successful!</p>
                  <p className="text-muted-foreground">
                    {result.count} transactions imported
                    {result.format && ` (Detected: ${result.format})`}
                  </p>
                </div>
                <Button onClick={() => router.push("/dashboard")} className="mt-4">
                  View Dashboard
                </Button>
              </div>
            ) : result?.error ? (
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-destructive">{result.error}</p>
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-4 text-left text-sm max-h-48 overflow-auto">
                      <p className="font-semibold mb-2">Errors:</p>
                      <ul className="list-disc list-inside">
                        {result.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>
                            Row {err.row}: {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <Button variant="outline" onClick={() => setResult(null)}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Drop your CSV file here</p>
                  <p className="text-muted-foreground">or click to browse</p>
                </div>
              </div>
            )}
          </div>

          {result?.success && result.errors && result.errors.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2 max-h-48 overflow-auto">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span>Row {err.row}: {err.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
