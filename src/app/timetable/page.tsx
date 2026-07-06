import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { TimetableClient } from "./TimetableClient";

export default async function TimetablePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/timetable");

  return <TimetableClient />;
}
