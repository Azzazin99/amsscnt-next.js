import {
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Car,
  ClipboardList,
  FileEdit,
  FileText,
  FolderArchive,
  GraduationCap,
  HeartHandshake,
  LayoutGrid,
  Mail,
  Monitor,
  Newspaper,
  Share,
  Trophy,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MenuGroupIcon } from "@/lib/modules/get-app-menu";

export function menuGroupIconComponent(icon: MenuGroupIcon): LucideIcon {
  switch (icon) {
    case "budget":
      return Wallet;
    case "person":
      return Users;
    case "academic":
      return GraduationCap;
    case "alert":
      return Bell;
    default:
      return LayoutGrid;
  }
}

const MODULE_ICONS: Record<string, LucideIcon> = {
  bookregister: BookOpen,
  book: FileText,
  bookobec: Share,
  idocument: FileText,
  dltv: Monitor,
  bets: FileEdit,
  mail: Mail,
  meeting: Calendar,
  leave: Briefcase,
  la: Briefcase,
  permission: Building2,
  car: Car,
  person: UserCircle,
  budget: Wallet,
  plan: LayoutGrid,
  achievement: Trophy,
  student_main: GraduationCap,
  spacial_student: HeartHandshake,
  news: Newspaper,
  affair: Briefcase,
  questionnaire: ClipboardList,
  alert: Bell,
  cabinet: FolderArchive,
};

export function moduleIconComponent(slug: string): LucideIcon {
  return MODULE_ICONS[slug] ?? LayoutGrid;
}
