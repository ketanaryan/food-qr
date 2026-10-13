import { redirect } from "next/navigation";

export default function OwnerRootPage() {
  redirect("/admin/dashboard");
}
