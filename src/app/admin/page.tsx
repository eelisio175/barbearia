import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getSettingsMap } from "@/lib/seed";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const cfg = await getSettingsMap();
  return <AdminDashboard shopName={cfg.shop_name ?? "Barbearia"} />;
}
