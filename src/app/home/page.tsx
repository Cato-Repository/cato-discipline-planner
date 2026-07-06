import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { HomeClient } from "./HomeClient";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/home");

  return <HomeClient />;
}
