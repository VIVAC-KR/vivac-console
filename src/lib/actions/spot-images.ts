"use server";

import { apiCreateWithResult, apiDelete } from "@/lib/api";
import type { ImagePresignResponse, SpotImageOut, SpotImageRole } from "@/lib/types";

/** 1단계: S3 presigned PUT URL 발급 */
export async function presignSpotImage(uid: string, filename: string, contentType: string) {
  return apiCreateWithResult<ImagePresignResponse>(
    `/internal/spots/${encodeURIComponent(uid)}/images/presign`,
    { filename, content_type: contentType }
  );
}

/** 3단계: S3 업로드 완료 후 DB 등록 (2단계 S3 PUT은 클라이언트가 upload_url로 직접 수행) */
export async function registerSpotImage(
  uid: string,
  s3Key: string,
  role: SpotImageRole,
  contentType: string
) {
  return apiCreateWithResult<SpotImageOut>(
    `/internal/spots/${encodeURIComponent(uid)}/images`,
    { s3_key: s3Key, role, content_type: contentType }
  );
}

/** soft delete — DB row/S3 객체는 남기고 deleted_at만 세팅 (백엔드 VAC-12) */
export async function deleteSpotImage(uid: string, imageUid: string) {
  return apiDelete(
    `/internal/spots/${encodeURIComponent(uid)}/images/${encodeURIComponent(imageUid)}`
  );
}
