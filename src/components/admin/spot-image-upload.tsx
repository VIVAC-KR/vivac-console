"use client";

import { useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";
import { presignSpotImage, registerSpotImage } from "@/lib/actions/spot-images";
import type { SpotImageOut, SpotImageRole } from "@/lib/types";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES_PER_SPOT = 10;
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

type PendingItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: "queued" | "uploading" | "error";
  error?: string;
};

/** role이 thumbnail인 이미지 중 sort_order가 가장 작은 것이 대표 — 백엔드 규칙과 동일 */
function currentThumbnailUid(images: SpotImageOut[]): string | null {
  const thumbs = images.filter((img) => img.role === "thumbnail");
  if (!thumbs.length) return null;
  return thumbs.reduce((min, img) => (img.sort_order < min.sort_order ? img : min)).uid;
}

export function SpotImageUpload({
  spotUid,
  initialImages,
}: {
  spotUid: string;
  initialImages: SpotImageOut[];
}) {
  const [images, setImages] = useState(initialImages);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [thumbnailId, setThumbnailId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const thumbUid = currentThumbnailUid(images);

  function addFiles(files: FileList | File[]) {
    setFormError(null);
    const errors: string[] = [];
    const accepted: PendingItem[] = [];
    let remaining = MAX_IMAGES_PER_SPOT - images.length - pending.length;

    for (const file of Array.from(files)) {
      if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
        errors.push(`${file.name}: 지원하지 않는 형식입니다 (jpeg/png/webp만 가능)`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name}: 파일 용량이 ${formatBytes(MAX_FILE_SIZE_BYTES)}를 초과합니다`);
        continue;
      }
      if (remaining <= 0) {
        errors.push(`${file.name}: 스팟당 최대 ${MAX_IMAGES_PER_SPOT}장까지 등록할 수 있습니다`);
        continue;
      }
      remaining -= 1;
      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "queued",
      });
    }

    if (accepted.length) setPending((prev) => [...prev, ...accepted]);
    if (errors.length) setFormError(errors.join("\n"));
  }

  function removePending(id: string) {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
    setThumbnailId((prev) => (prev === id ? null : prev));
  }

  async function handleUpload() {
    setIsUploading(true);
    setFormError(null);
    // 실패한 항목도 다시 시도 대상에 포함 — 별도 "재시도" 버튼 없이 업로드 버튼 재클릭으로 처리
    const toUpload = pending.filter((p) => p.status !== "uploading");

    for (const item of toUpload) {
      setPending((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: "uploading", error: undefined } : p))
      );

      const { data: presign, error: presignError } = await presignSpotImage(
        spotUid,
        item.file.name,
        item.file.type
      );
      if (presignError || !presign) {
        setPending((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: "error", error: presignError ?? "업로드 URL 발급 실패" } : p
          )
        );
        continue;
      }

      let putOk = true;
      try {
        const res = await fetch(presign.upload_url, {
          method: "PUT",
          headers: { "Content-Type": item.file.type },
          body: item.file,
        });
        putOk = res.ok;
      } catch {
        putOk = false;
      }
      if (!putOk) {
        setPending((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "error", error: "S3 업로드 실패" } : p))
        );
        continue;
      }

      const role: SpotImageRole = item.id === thumbnailId ? "thumbnail" : "detail";
      const { data: registered, error: registerError } = await registerSpotImage(
        spotUid,
        presign.s3_key,
        role,
        item.file.type
      );
      if (registerError || !registered) {
        setPending((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: "error", error: registerError ?? "등록 실패" } : p
          )
        );
        continue;
      }

      setImages((prev) => [...prev, registered]);
      URL.revokeObjectURL(item.previewUrl);
      setPending((prev) => prev.filter((p) => p.id !== item.id));
      setThumbnailId((prev) => (prev === item.id ? null : prev));
    }

    setIsUploading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {images.map((img) => (
          <div key={img.uid} className="relative aspect-square overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element -- CDN 도메인이 next.config에 등록돼 있지 않음 */}
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            {img.uid === thumbUid && (
              <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                대표
              </span>
            )}
          </div>
        ))}
        {images.length === 0 && (
          <p className="col-span-full text-sm text-zinc-400">등록된 사진 없음</p>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center text-sm text-zinc-500 transition-colors",
          isDragging && "border-primary bg-muted"
        )}
      >
        이미지를 드래그하거나 클릭해서 선택하세요
        <br />
        <span className="text-xs text-zinc-400">
          jpeg/png/webp · 장당 최대 {formatBytes(MAX_FILE_SIZE_BYTES)} · 스팟당 최대 {MAX_IMAGES_PER_SPOT}장
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_CONTENT_TYPES.join(",")}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {formError && (
        <p className="whitespace-pre-line text-xs text-destructive">{formError}</p>
      )}

      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500">
            이번에 업로드하는 사진 중 대표 이미지로 지정할 한 장을 선택하세요(선택하지 않으면 전부
            상세 사진으로 등록됩니다). 이미 등록된 사진의 대표 여부는 등록 후 변경할 수 없습니다.
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {pending.map((item) => (
              <div key={item.id} className="flex flex-col gap-1">
                <div className="relative aspect-square overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element -- object URL 미리보기 */}
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                  {item.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="size-5 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePending(item.id)}
                    disabled={item.status === "uploading"}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white disabled:opacity-50"
                  >
                    <X className="size-3" />
                  </button>
                </div>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    name="spot-image-thumbnail"
                    checked={thumbnailId === item.id}
                    onChange={() => setThumbnailId(item.id)}
                    disabled={item.status === "uploading"}
                  />
                  대표 이미지
                </label>
                {item.status === "error" && (
                  <p className="break-all text-[10px] text-destructive">{item.error}</p>
                )}
              </div>
            ))}
          </div>
          <div>
            <Button type="button" onClick={handleUpload} disabled={isUploading}>
              {isUploading && <Loader2 className="animate-spin" />}
              {isUploading ? "업로드 중…" : `업로드 (${pending.length}장)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
