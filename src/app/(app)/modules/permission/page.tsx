import { redirect } from "next/navigation";

export default function PermissionHomePage() {
  redirect("/modules/permission/requests");
}
