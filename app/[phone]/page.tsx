import { redirect } from "next/navigation";
import { findOrCreateLink, incrementLinkVisits, visitTrackedLink } from "@/lib/neon";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ phone: string }>;
  searchParams?: Promise<{ text?: string }>;
}) {
  const { phone } = await params;
  const trackedDestination = await visitTrackedLink(phone);
  if (trackedDestination) redirect(trackedDestination);

  const sp = searchParams ? await searchParams : {};
  const text = sp?.text;

  let url = `https://wa.me/${phone}`;

  if (text) {
    url += `?text=${encodeURIComponent(text)}`;
  }

  const link = await findOrCreateLink(url);
  await incrementLinkVisits(link.code);
  redirect(url);
}
