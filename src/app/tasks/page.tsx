import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import { TasksClient } from "./TasksClient";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/tasks");

  return <TasksClient />;
}
