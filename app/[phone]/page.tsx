import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { visitTrackedLink } from "@/lib/neon";
import { visitFromHeaders, withLocation } from "@/lib/visit";

export default async function Page({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  const headerList = await headers();
  const visit = await withLocation(visitFromHeaders(headerList), headerList);
  const trackedDestination = await visitTrackedLink(phone, visit);
  if (trackedDestination) redirect(trackedDestination);

  notFound();
}
