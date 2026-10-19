import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { findOrCreateLink, recordVisit, visitTrackedLink } from "@/lib/neon";
import { visitFromHeaders } from "@/lib/visit";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ phone: string }>;
  searchParams?: Promise<{ text?: string }>;
}) {
  const { phone } = await params;
  const headerList = await headers();
  const visit = visitFromHeaders(headerList);
  const trackedDestination = await visitTrackedLink(phone, visit);
  if (trackedDestination) redirect(trackedDestination);

  const sp = searchParams ? await searchParams : {};
  const text = sp?.text;

  let url = `https://wa.me/${phone}`;

  if (text) {
    url += `?text=${encodeURIComponent(text)}`;
  }

  const link = await findOrCreateLink(url);
  await recordVisit(link.code, visit);
  redirect(url);
}
