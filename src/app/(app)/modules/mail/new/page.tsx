import { redirect } from "next/navigation";
import { MailComposeForm } from "@/components/mail/mail-compose-form";
import { createMailDocument } from "@/lib/mail/actions";
import { canWriteMail } from "@/lib/mail/permissions";
import {
  listActivePeopleForMailPicker,
  listDistrictClerksByWorkgroupForMailPicker,
  listSchoolDirectorsBySchoolForMailPicker,
  listSchoolStaffBySchoolForMailPicker,
  listWorkgroupMembersByWorkgroupForMailPicker,
} from "@/lib/mail/queries";
import { requireMailScope } from "@/lib/mail/scope";

export default async function MailComposePage() {
  const { user, perms } = await requireMailScope();
  if (!canWriteMail(user, perms)) redirect("/modules/mail/sent");

  const [
    people,
    workgroupMemberGroups,
    districtClerkGroups,
    schoolDirectorGroups,
    schoolStaffGroups,
  ] = await Promise.all([
    listActivePeopleForMailPicker(),
    listWorkgroupMembersByWorkgroupForMailPicker(),
    listDistrictClerksByWorkgroupForMailPicker(),
    listSchoolDirectorsBySchoolForMailPicker(),
    listSchoolStaffBySchoolForMailPicker(),
  ]);

  return (
    <MailComposeForm
      action={createMailDocument}
      officeName={user.officeName}
      people={people}
      workgroupMemberGroups={workgroupMemberGroups}
      districtClerkGroups={districtClerkGroups}
      schoolDirectorGroups={schoolDirectorGroups}
      schoolStaffGroups={schoolStaffGroups}
    />
  );
}
