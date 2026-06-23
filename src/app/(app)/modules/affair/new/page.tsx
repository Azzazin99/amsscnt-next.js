import { redirect } from "next/navigation";
import { AffairForm } from "@/components/affair/affair-form";
import { createAffairEntry } from "@/lib/affair/actions";
import {
  canWriteAffair,
  getAffairPermissions,
} from "@/lib/affair/permissions";
import {
  getLatestAffairLocation,
  getLatestAffairSubject,
  listActivePeopleForAffairPicker,
} from "@/lib/affair/queries";
import { requireAffairScope } from "@/lib/affair/scope";
import { todayBangkokDateString } from "@/lib/bookregister/receive/ref-id";

export default async function AffairNewPage() {
  const { user } = await requireAffairScope();
  const perms = await getAffairPermissions(Number(user.id));
  if (!canWriteAffair(user, perms)) redirect("/modules/affair");

  const [people, latestSubject, latestLocation] = await Promise.all([
    listActivePeopleForAffairPicker(),
    getLatestAffairSubject(),
    getLatestAffairLocation(),
  ]);

  return (
    <AffairForm
      action={createAffairEntry}
      people={people}
      title="เพิ่มภารกิจผู้อำนวยการ"
      cancelHref="/modules/affair"
      defaultValues={{
        affairDate: todayBangkokDateString(),
        affairTime: "",
        subject: "",
        location: "",
        operationPersonId: "",
        remark: null,
      }}
      latestSubject={latestSubject}
      latestLocation={latestLocation}
    />
  );
}
