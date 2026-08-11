import { redirect } from "next/navigation";

export default function MailMainPage() {
  redirect("/modules/mail/inbox");
}
