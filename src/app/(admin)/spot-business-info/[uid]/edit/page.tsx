import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { auth } from "@/auth";
import { SbiEditForm } from "@/components/admin/sbi-edit-form";

type BusinessInfoDetail = {
  uid: string;
  spot_uid: string;
  business_reg_no: string | null;
  tourism_business_reg_no: string | null;
  business_type: string | null;
  operation_type: string | null;
  operating_agency: string | null;
  operating_status: string | null;
  national_park_no: number | null;
  national_park_office_code: string | null;
  national_park_serial_no: string | null;
  national_park_category_code: string | null;
  licensed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

async function saveBusinessInfo(uid: string, data: Record<string, unknown>) {
  "use server";
  const session = await auth();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/internal/spot-business-info/${uid}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.accessToken ?? ""}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
}

export default async function BusinessInfoEditPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;

  let info: BusinessInfoDetail;
  try {
    info = await apiFetch<BusinessInfoDetail>(`/internal/spot-business-info/${uid}`);
  } catch {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/spot-business-info" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Business Info 목록
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Business Info 편집</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Spot: <span className="font-mono">{info.spot_uid}</span>
          {info.updated_at && ` · 수정일: ${new Date(info.updated_at).toLocaleString("ko-KR")}`}
        </p>
      </div>
      <SbiEditForm info={info} onSave={saveBusinessInfo} />
    </div>
  );
}
