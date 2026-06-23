import { RegisterReportPage } from "../register-report-page";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default function SendRegisterReportPage({ searchParams }: Props) {
  return RegisterReportPage({ kind: "send", searchParams });
}
