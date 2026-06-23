import { RegisterReportPage } from "../register-report-page";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default function ReceiveRegisterReportPage({ searchParams }: Props) {
  return RegisterReportPage({ kind: "receive", searchParams });
}
