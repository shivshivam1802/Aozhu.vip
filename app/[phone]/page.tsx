import { after } from "next/server";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getLinkDestination, recordVisit } from "@/lib/neon";
import { visitFromHeaders, withLocation } from "@/lib/visit";

export default async function Page({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  const link = await getLinkDestination(phone);
  if (!link?.target_url) notFound();

  const headerList = await headers();
  const visitBase = visitFromHeaders(headerList);
  after(async () => {
    try {
      await recordVisit(link.code, await withLocation(visitBase, headerList));
    } catch (error) {
      console.error("Failed to record tracked link visit:", error);
    }
  });

  redirect(link.target_url);
}
