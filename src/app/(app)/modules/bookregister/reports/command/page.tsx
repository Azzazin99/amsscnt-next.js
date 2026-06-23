import { RegisterReportPage } from "../register-report-page";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default function CommandRegisterReportPage({ searchParams }: Props) {
  return RegisterReportPage({ kind: "command", searchParams });
}
