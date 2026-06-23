import { redirect } from "next/navigation";

export default function StudentMainHomePage() {
  redirect("/modules/student_main/students");
}
