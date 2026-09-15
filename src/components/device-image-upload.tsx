import React, { useRef, useState, useEffect } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export interface DeviceImageUploadProps {
  id: string;
  label?: string;
  hint?: string;
  value: File | null;
  currentImageUrl?: string | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMb?: number;
  disabled?: boolean;
}

export function DeviceImageUpload({
  id,
  label = "Unggah Gambar dari Perangkat",
  hint = "Mendukung JPG, PNG, atau WEBP (maks. 10MB). Tarik berkas ke sini atau klik untuk memilih.",
  value,
  currentImageUrl,
  onChange,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  maxSizeMb = 10,
  disabled = false,
}: DeviceImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (value) {
      const objUrl = URL.createObjectURL(value);
      setPreviewUrl(objUrl);
      return () => URL.revokeObjectURL(objUrl);
    } else if (currentImageUrl) {
      setPreviewUrl(currentImageUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [value, currentImageUrl]);

  function validateAndSelect(file: File) {
    setErrorMsg(null);
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Berkas harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMsg(`Ukuran gambar melebihi batas maksimum (${maxSizeMb} MB).`);
      return;
    }
    onChange(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  }

  function handleRemove() {
    onChange(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <div className="w-full space-y-2" id={`${id}-container`}>
      {label && (
        <label htmlFor={id} className="label flex items-center justify-between">
          <span>{label}</span>
          {value && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-primary">
              <CheckCircle2 size={12} /> Terpilih ({formatBytes(value.size)})
            </span>
          )}
        </label>
      )}

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div
          id={`${id}-preview-card`}
          className="relative overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm transition-all"
        >
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative h-28 w-full sm:w-32 shrink-0 overflow-hidden rounded-md border border-border/80 bg-muted/40">
              <img
                src={previewUrl}
                alt="Pratinjau gambar"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-foreground">
                <ImageIcon size={14} className="text-primary shrink-0" />
                <span className="truncate max-w-[200px]">
                  {value?.name || "Gambar yang dipilih"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {value ? `Ukuran: ${formatBytes(value.size)}` : "Gambar siap disimpan"}
              </p>
              <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  id={`${id}-change-btn`}
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} /> Ganti Gambar
                </button>
                <button
                  type="button"
                  id={`${id}-remove-btn`}
                  disabled={disabled}
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-[11px] font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={12} /> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          id={`${id}-dropzone`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-all ${
            isDragging
              ? "border-primary bg-primary/10 scale-[0.99]"
              : "border-border hover:border-primary/60 hover:bg-muted/30 bg-muted/10"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <div className="mb-2 grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
            <UploadCloud size={20} />
          </div>
          <p className="text-xs font-semibold text-foreground">Pilih gambar dari perangkat Anda</p>
          <p className="mt-1 max-w-[280px] text-[11px] text-muted-foreground leading-relaxed">
            {hint}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1 text-[11px] font-medium text-secondary-foreground shadow-xs">
            Jelajahi Berkas
          </div>
        </div>
      )}

      {errorMsg && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs text-destructive pt-1">
          <AlertCircle size={13} className="shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}
    </div>
  );
}
