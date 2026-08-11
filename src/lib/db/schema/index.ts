import {
  boolean,
  date,
  double,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  float,
  text,
  timestamp,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const organizationTypeEnum = mysqlEnum("organization_type", [
  "district",
  "school",
]);

export const districtSettings = mysqlTable("district_settings", {
  id: int("id").autoincrement().primaryKey(),
  officeName: varchar("office_name", { length: 255 }).notNull(),
  officeCode: varchar("office_code", { length: 10 }).notNull().default("1701"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workgroups = mysqlTable("workgroups", {
  id: int("id").autoincrement().primaryKey(),
  legacyCode: int("legacy_code"),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
});

export const schoolGroups = mysqlTable("school_groups", {
  id: int("id").autoincrement().primaryKey(),
  legacyId: int("legacy_id"),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
});

export const schools = mysqlTable(
  "schools",
  {
    id: int("id").autoincrement().primaryKey(),
    schoolCode: varchar("school_code", { length: 12 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    schoolType: int("school_type").default(0).notNull(),
    schoolGroupId: int("school_group_id").references(() => schoolGroups.id),
    active: boolean("active").default(true).notNull(),
  },
  (t) => [uniqueIndex("schools_school_code_idx").on(t.schoolCode)],
);

export const people = mysqlTable(
  "people",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    prefix: varchar("prefix", { length: 50 }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    workgroupId: int("workgroup_id").references(() => workgroups.id),
    schoolId: int("school_id").references(() => schools.id),
    organizationType: mysqlEnum("organization_type", ["district", "school"])
      .notNull()
      .default("district"),
    positionCode: int("position_code"),
    status: int("status").default(0).notNull(),
    multiSchool: boolean("multi_school").default(false).notNull(),
    serviceStartDate: date("service_start_date", { mode: "string" }),
    sex: varchar("sex", { length: 1 }),
    birthDate: date("birth_date", { mode: "string" }),
    personOrder: int("person_order").default(0),
    pictureUrl: varchar("picture_url", { length: 255 }),
  },
  (t) => [
    uniqueIndex("people_person_id_idx").on(t.personId),
    index("people_org_status_idx").on(t.organizationType, t.status),
    index("people_school_status_idx").on(t.schoolId, t.status),
  ],
);

export const personSchoolAssignments = mysqlTable(
  "person_school_assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    schoolId: int("school_id")
      .notNull()
      .references(() => schools.id),
  },
  (t) => [
    uniqueIndex("person_school_assignments_unique").on(t.personId, t.schoolId),
  ],
);

/** legacy: รักษาการในตำแหน่ง ผอ.รร. */
export const personDelegate = mysqlTable("person_delegate", {
  id: int("id").autoincrement().primaryKey(),
  schoolCode: varchar("school_code", { length: 11 }).notNull(),
  personId: varchar("person_id", { length: 13 }).notNull(),
  start: date("start", { mode: "string" }).notNull(),
  finish: date("finish", { mode: "string" }).notNull(),
  remark: varchar("remark", { length: 250 }).notNull(),
  officer: varchar("officer", { length: 13 }).notNull(),
  recDate: date("rec_date", { mode: "string" }).notNull(),
});

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    username: varchar("username", { length: 100 }).notNull(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    organizationType: mysqlEnum("organization_type", ["district", "school"])
      .notNull()
      .default("district"),
    schoolId: int("school_id").references(() => schools.id),
    isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    status: int("status").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("users_username_idx").on(t.username),
    uniqueIndex("users_person_id_idx").on(t.personId),
  ],
);

export const menuGroups = mysqlTable("menu_groups", {
  id: int("id").autoincrement().primaryKey(),
  legacyId: int("legacy_id"),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
});

export const modules = mysqlTable("modules", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  menuGroupId: int("menu_group_id").references(() => menuGroups.id),
  whereWork: int("where_work").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
});

export const moduleAdmins = mysqlTable(
  "module_admins",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    moduleSlug: varchar("module_slug", { length: 64 }).notNull(),
    assignedAt: date("assigned_at", { mode: "string" }),
    assignedBy: int("assigned_by").references(() => users.id),
  },
  (t) => [
    uniqueIndex("module_admins_user_module_idx").on(t.userId, t.moduleSlug),
  ],
);

export const registerPermissions = mysqlTable("register_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: int("p1").default(0).notNull(),
  p2: int("p2").default(0).notNull(),
  p3: int("p3").default(0).notNull(),
  canViewSecret: boolean("can_view_secret").default(false).notNull(),
});

/** legacy: person_permission — สิทธิ์โมดูลบุคลากร p1/p2/p3 */
export const personPermissions = mysqlTable("person_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: int("p1").default(0).notNull(),
  p2: int("p2").default(0).notNull(),
  p3: int("p3").default(0).notNull(),
});

export const registerYears = mysqlTable(
  "register_years",
  {
    id: int("id").autoincrement().primaryKey(),
    year: int("year").notNull(),
    schoolId: int("school_id").references(() => schools.id),
    yearActive: boolean("year_active").default(false).notNull(),
    startReceiveNum: int("start_receive_num").default(1).notNull(),
    startSendNum: int("start_send_num").default(1).notNull(),
    startCommandNum: int("start_command_num").default(1).notNull(),
    startCertificateNum: int("start_certificate_num").default(1).notNull(),
  },
  (t) => [
    uniqueIndex("register_years_year_school_idx").on(t.year, t.schoolId),
  ],
);

const registerBase = {
  id: int("id").autoincrement().primaryKey(),
  schoolId: int("school_id").references(() => schools.id),
  year: int("year").notNull(),
  registerNumber: int("register_number").notNull(),
  bookNo: varchar("book_no", { length: 100 }),
  signdate: date("signdate", { mode: "string" }),
  subject: text("subject"),
  comment: text("comment"),
  registerDate: date("register_date", { mode: "string" }),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  officerId: int("officer_id").references(() => users.id),
  secret: boolean("secret").default(false).notNull(),
  urgencyLevel: int("urgency_level").default(1).notNull(),
  secretLevel: int("secret_level").default(0).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
};

export const registerReceives = mysqlTable(
  "register_receives",
  {
    ...registerBase,
    bookFrom: text("book_from"),
    bookTo: text("book_to"),
    operation: varchar("operation", { length: 255 }),
    workgroupId: int("workgroup_id").references(() => workgroups.id),
    recordType: int("record_type").default(1).notNull(),
    bookLink: int("book_link").default(0).notNull(),
    source: varchar("source", { length: 32 }).default("external").notNull(),
  },
  (t) => [
    uniqueIndex("register_receives_ref_id_idx").on(t.refId),
    uniqueIndex("register_receives_year_num_school_idx").on(
      t.year,
      t.registerNumber,
      t.schoolId,
    ),
    index("register_receives_report_idx").on(
      t.year,
      t.schoolId,
      t.registerNumber,
    ),
  ],
);

export const registerSends = mysqlTable(
  "register_sends",
  {
    ...registerBase,
    bookFrom: text("book_from"),
    bookTo: text("book_to"),
    operation: varchar("operation", { length: 255 }),
    workgroupId: int("workgroup_id").references(() => workgroups.id),
    officeType: int("office_type").default(1).notNull(),
    forwardedToSchools: boolean("forwarded_to_schools").default(false).notNull(),
  },
  (t) => [
    uniqueIndex("register_sends_ref_id_idx").on(t.refId),
    uniqueIndex("register_sends_year_num_school_idx").on(
      t.year,
      t.registerNumber,
      t.schoolId,
    ),
    index("register_sends_report_idx").on(
      t.year,
      t.schoolId,
      t.registerNumber,
    ),
  ],
);

export const registerCommands = mysqlTable(
  "register_commands",
  {
    ...registerBase,
    fileName: varchar("file_name", { length: 255 }),
  },
  (t) => [
    uniqueIndex("register_commands_ref_id_idx").on(t.refId),
    uniqueIndex("register_commands_year_num_school_idx").on(
      t.year,
      t.registerNumber,
      t.schoolId,
    ),
    index("register_commands_report_idx").on(t.year, t.registerNumber),
  ],
);

export const registerCertificates = mysqlTable(
  "register_certificates",
  {
    ...registerBase,
    fileName: varchar("file_name", { length: 255 }),
  },
  (t) => [
    uniqueIndex("register_certificates_ref_id_idx").on(t.refId),
    uniqueIndex("register_certificates_year_num_school_idx").on(
      t.year,
      t.registerNumber,
      t.schoolId,
    ),
  ],
);

export const registerReceiveFiles = mysqlTable("register_receive_files", {
  id: int("id").autoincrement().primaryKey(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileDes: varchar("file_des", { length: 255 }),
});

export const registerSendFiles = mysqlTable("register_send_files", {
  id: int("id").autoincrement().primaryKey(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileDes: varchar("file_des", { length: 255 }),
});

/** legacy: bookregister_office_no — prefix เลขที่หนังสือออก เช่น "ที่ ศธ 04146/" */
export const registerOfficeNumbers = mysqlTable("bookregister_office_no", {
  id: int("id").autoincrement().primaryKey(),
  officeNo: text("office_no").notNull(),
  schoolCode: varchar("school_code", { length: 12 }),
  officer: varchar("officer", { length: 13 }),
  recDate: date("rec_date", { mode: "string" }),
});

/** legacy: book_group — กลุ่มหนังสือ (ส่งถึงหลายโรงเรียน) */
export const bookGroups = mysqlTable("book_groups", {
  id: int("id").autoincrement().primaryKey(),
  legacyId: int("legacy_id"),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
});

export const bookGroupMembers = mysqlTable(
  "book_group_members",
  {
    id: int("id").autoincrement().primaryKey(),
    groupId: int("group_id")
      .notNull()
      .references(() => bookGroups.id, { onDelete: "cascade" }),
    schoolId: int("school_id")
      .notNull()
      .references(() => schools.id),
  },
  (t) => [
    uniqueIndex("book_group_members_unique").on(t.groupId, t.schoolId),
  ],
);

/** legacy: book_main — หนังสือรับส่งอิเล็กทรอนิกส์ */
export const bookDocuments = mysqlTable(
  "book_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    refId: varchar("ref_id", { length: 64 }).notNull(),
    bookType: int("book_type").notNull(),
    senderPersonId: varchar("sender_person_id", { length: 13 }).notNull(),
    officeCode: varchar("office_code", { length: 13 }).notNull(),
    senderSchoolId: int("sender_school_id").references(() => schools.id),
    senderWorkgroupId: int("sender_workgroup_id").references(
      () => workgroups.id,
    ),
    senderUserId: int("sender_user_id").references(() => users.id),
    urgencyLevel: int("urgency_level").default(1).notNull(),
    secretLevel: int("secret_level").default(0).notNull(),
    bookNo: varchar("book_no", { length: 100 }).notNull(),
    signDate: date("sign_date", { mode: "string" }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    detail: text("detail"),
    sendDate: timestamp("send_date").defaultNow().notNull(),
    bookRegisLink: int("book_regis_link").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("book_documents_ref_id_idx").on(t.refId),
    index("book_documents_book_type_idx").on(t.bookType),
    index("book_documents_sender_school_idx").on(t.senderSchoolId),
  ],
);

/** legacy: book_sendto_answer — ผู้รับ/สถานะตอบรับ */
export const bookRecipients = mysqlTable(
  "book_recipients",
  {
    id: int("id").autoincrement().primaryKey(),
    refId: varchar("ref_id", { length: 64 }).notNull(),
    sendLevel: int("send_level"),
    sendTo: varchar("send_to", { length: 32 }).notNull(),
    schoolScope: varchar("school_scope", { length: 32 }),
    status: int("status"),
    answered: boolean("answered").default(false).notNull(),
    answeredAt: timestamp("answered_at"),
    forwardFrom: varchar("forward_from", { length: 32 }),
    forwardReceivedAt: timestamp("forward_received_at"),
  },
  (t) => [
    index("book_recipients_ref_id_idx").on(t.refId),
    index("book_recipients_send_to_idx").on(t.sendTo),
  ],
);

/** legacy: book_filebook */
export const bookFiles = mysqlTable("book_files", {
  id: int("id").autoincrement().primaryKey(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileDes: varchar("file_des", { length: 255 }),
});

/** นโยบายอายุเก็บหนังสือตามประเภท (book_type) — ค่าเริ่มต้น 2 ปี */
export const bookRetentionSettings = mysqlTable(
  "book_retention_settings",
  {
    id: int("id").autoincrement().primaryKey(),
    bookType: int("book_type").notNull(),
    retentionYears: int("retention_years").default(2).notNull(),
  },
  (t) => [uniqueIndex("book_retention_settings_book_type_unique").on(t.bookType)],
);

/** legacy: book_permission — สิทธิ์โมดูลรับส่งหนังสือ */
export const bookPermissions = mysqlTable("book_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: int("p1").default(0).notNull(),
  p2: int("p2").default(0).notNull(),
  p3: int("p3").default(0).notNull(),
  canViewSecret: boolean("can_view_secret").default(false).notNull(),
});

/** legacy: mail_group — กลุ่มบุคลากร (หนังสือเวียน) */
export const mailGroups = mysqlTable("mail_groups", {
  id: int("id").autoincrement().primaryKey(),
  legacyId: int("legacy_id"),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
});

export const mailGroupMembers = mysqlTable(
  "mail_group_members",
  {
    id: int("id").autoincrement().primaryKey(),
    groupId: int("group_id")
      .notNull()
      .references(() => mailGroups.id, { onDelete: "cascade" }),
    personId: varchar("person_id", { length: 13 }).notNull(),
  },
  (t) => [
    uniqueIndex("mail_group_members_unique").on(t.groupId, t.personId),
    index("mail_group_members_person_id_idx").on(t.personId),
  ],
);

/** legacy: mail_main — หนังสือเวียน */
export const mailDocuments = mysqlTable(
  "mail_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    refId: varchar("ref_id", { length: 64 }).notNull(),
    senderPersonId: varchar("sender_person_id", { length: 13 }).notNull(),
    senderUserId: int("sender_user_id").references(() => users.id),
    subject: varchar("subject", { length: 150 }).notNull(),
    detail: text("detail"),
    sendDate: timestamp("send_date").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("mail_documents_ref_id_idx").on(t.refId),
    index("mail_documents_sender_person_id_idx").on(t.senderPersonId),
    index("mail_documents_send_date_idx").on(t.sendDate),
  ],
);

/** legacy: mail_sendto_answer — ผู้รับหนังสือเวียน */
export const mailRecipients = mysqlTable(
  "mail_recipients",
  {
    id: int("id").autoincrement().primaryKey(),
    refId: varchar("ref_id", { length: 64 }).notNull(),
    sendTo: varchar("send_to", { length: 13 }).notNull(),
    answered: boolean("answered").default(false).notNull(),
    answeredAt: timestamp("answered_at"),
  },
  (t) => [
    index("mail_recipients_ref_id_idx").on(t.refId),
    index("mail_recipients_send_to_idx").on(t.sendTo),
  ],
);

/** legacy: mail_filebook */
export const mailFiles = mysqlTable("mail_files", {
  id: int("id").autoincrement().primaryKey(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileDes: varchar("file_des", { length: 255 }),
});

/** legacy: mail_permission — เจ้าหน้าที่หนังสือเวียน */
export const mailPermissions = mysqlTable("mail_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: int("p1").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
  recDate: date("rec_date", { mode: "string" }),
});

/** legacy: la_year → leave_years */
export const leaveYears = mysqlTable(
  "leave_years",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    yearActive: boolean("year_active").default(false).notNull(),
  },
  (t) => [
    uniqueIndex("leave_years_budget_year_idx").on(t.budgetYear),
    index("leave_years_active_idx").on(t.yearActive),
  ],
);

/** legacy: la_permission → leave_permissions */
export const leavePermissions = mysqlTable("leave_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: int("p1").default(0).notNull(),
  p2: int("p2").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
});

/** legacy: la_person_set → leave_person_settings */
export const leavePersonSettings = mysqlTable(
  "leave_person_settings",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    commentPersonId: varchar("comment_person_id", { length: 13 }),
    commentPerson2Id: varchar("comment_person2_id", { length: 13 }),
    grantPersonId: varchar("grant_person_id", { length: 13 }),
    officerPersonId: varchar("officer_person_id", { length: 13 }),
  },
  (t) => [
    uniqueIndex("leave_person_settings_person_id_idx").on(t.personId),
    index("leave_person_settings_comment_person_idx").on(t.commentPersonId),
    index("leave_person_settings_comment_person2_idx").on(t.commentPerson2Id),
    index("leave_person_settings_grant_person_idx").on(t.grantPersonId),
  ],
);

/** legacy: la_collect → leave_collect */
export const leaveCollect = mysqlTable(
  "leave_collect",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    collectDay: float("collect_day").default(0).notNull(),
    thisYearDay: int("this_year_day").default(0).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("leave_collect_budget_year_person_id_idx").on(
      t.budgetYear,
      t.personId,
    ),
  ],
);

/** legacy: la_main → leave_requests */
export const leaveRequests = mysqlTable(
  "leave_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    schoolId: int("school_id").references(() => schools.id),
    leaveType: int("leave_type").notNull(),
    writeAt: varchar("write_at", { length: 100 }),
    because: varchar("because", { length: 250 }),
    leaveStart: date("leave_start", { mode: "string" }).notNull(),
    leaveFinish: date("leave_finish", { mode: "string" }).notNull(),
    halfDayPeriod: varchar("half_day_period", { length: 10 }),
    leaveTotal: float("leave_total").notNull(),
    lastLeaveStart: date("last_leave_start", { mode: "string" }),
    lastLeaveFinish: date("last_leave_finish", { mode: "string" }),
    lastLeaveTotal: float("last_leave_total"),
    sickAgo: float("sick_ago"),
    sickThis: float("sick_this"),
    sickTotal: float("sick_total"),
    privacyAgo: float("privacy_ago"),
    privacyThis: float("privacy_this"),
    privacyTotal: float("privacy_total"),
    birthAgo: float("birth_ago"),
    birthThis: float("birth_this"),
    birthTotal: float("birth_total"),
    relaxAgo: float("relax_ago"),
    relaxThis: float("relax_this"),
    relaxTotal: float("relax_total"),
    relaxCollect: float("relax_collect"),
    relaxThisYear: float("relax_this_year"),
    contact: varchar("contact", { length: 150 }),
    contactTel: varchar("contact_tel", { length: 20 }),
    documentName: varchar("document_name", { length: 100 }),
    noComment: boolean("no_comment").default(false).notNull(),
    grantPersonSelected: varchar("grant_person_selected", { length: 13 }),
    jobPersonId: varchar("job_person_id", { length: 13 }),
    jobPersonSigned: boolean("job_person_signed").default(false).notNull(),
    officerComment: varchar("officer_comment", { length: 200 }),
    officerSignPersonId: varchar("officer_sign_person_id", { length: 13 }),
    officerDate: timestamp("officer_date"),
    groupComment: varchar("group_comment", { length: 100 }),
    groupSignPersonId: varchar("group_sign_person_id", { length: 13 }),
    groupDate: timestamp("group_date"),
    groupComment2: varchar("group_comment2", { length: 100 }),
    groupSign2PersonId: varchar("group_sign2_person_id", { length: 13 }),
    groupDate2: timestamp("group_date2"),
    commanderGrant: int("commander_grant"),
    commanderComment: varchar("commander_comment", { length: 100 }),
    commanderSignPersonId: varchar("commander_sign_person_id", { length: 13 }),
    grantDate: timestamp("grant_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("leave_requests_person_id_idx").on(t.personId),
    index("leave_requests_school_id_idx").on(t.schoolId),
    index("leave_requests_leave_start_idx").on(t.leaveStart),
    index("leave_requests_person_type_grant_idx").on(
      t.personId,
      t.leaveType,
      t.commanderGrant,
    ),
    index("leave_requests_date_range_idx").on(t.leaveStart, t.leaveFinish),
    index("leave_requests_school_grant_idx").on(t.schoolId, t.commanderGrant),
    index("leave_requests_job_person_unsigned_idx").on(t.jobPersonId),
  ],
);

export const leaveQuotaBalances = mysqlTable(
  "leave_quota_balances",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    budgetYear: int("budget_year").notNull(),
    leaveType: int("leave_type").notNull(),
    entitled: float("entitled").default(0).notNull(),
    used: float("used").default(0).notNull(),
    carried: float("carried").default(0).notNull(),
  },
  (t) => [
    uniqueIndex("leave_quota_balances_person_year_type_idx").on(
      t.personId,
      t.budgetYear,
      t.leaveType,
    ),
  ],
);

export const leaveRequestFiles = mysqlTable(
  "leave_request_files",
  {
    id: int("id").autoincrement().primaryKey(),
    requestId: int("request_id")
      .notNull()
      .references(() => leaveRequests.id, { onDelete: "cascade" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileDes: varchar("file_des", { length: 255 }),
    fileSize: int("file_size"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("leave_request_files_request_id_idx").on(t.requestId)],
);

/** legacy: la_cancel → leave_cancellations */
export const leaveCancellations = mysqlTable(
  "leave_cancellations",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    sourceRequestId: int("source_request_id")
      .notNull()
      .references(() => leaveRequests.id, { onDelete: "cascade" }),
    leaveType: int("leave_type").notNull(),
    writeAt: varchar("write_at", { length: 100 }),
    permissionStart: date("permission_start", { mode: "string" }).notNull(),
    permissionFinish: date("permission_finish", { mode: "string" }).notNull(),
    permissionTotal: float("permission_total").notNull(),
    because: varchar("because", { length: 200 }).notNull(),
    cancelStart: date("cancel_start", { mode: "string" }).notNull(),
    cancelFinish: date("cancel_finish", { mode: "string" }).notNull(),
    cancelTotal: float("cancel_total").notNull(),
    noComment: boolean("no_comment").default(false).notNull(),
    grantPersonSelected: varchar("grant_person_selected", { length: 13 }),
    officerComment: varchar("officer_comment", { length: 200 }),
    officerSignPersonId: varchar("officer_sign_person_id", { length: 13 }),
    officerDate: timestamp("officer_date"),
    groupComment: varchar("group_comment", { length: 100 }),
    groupSignPersonId: varchar("group_sign_person_id", { length: 13 }),
    groupDate: timestamp("group_date"),
    commanderGrant: int("commander_grant"),
    commanderComment: varchar("commander_comment", { length: 100 }),
    commanderSignPersonId: varchar("commander_sign_person_id", { length: 13 }),
    grantDate: timestamp("grant_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("leave_cancellations_source_request_id_idx").on(
      t.sourceRequestId,
    ),
    index("leave_cancellations_person_id_idx").on(t.personId),
    index("leave_cancellations_cancel_start_idx").on(t.cancelStart),
    index("leave_cancellations_person_type_grant_idx").on(
      t.personId,
      t.leaveType,
      t.commanderGrant,
    ),
    index("leave_cancellations_date_range_idx").on(
      t.cancelStart,
      t.cancelFinish,
    ),
  ],
);

/** legacy: permission_year */
export const permissionYears = mysqlTable(
  "permission_years",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    yearActive: boolean("year_active").default(false).notNull(),
  },
  (t) => [uniqueIndex("permission_years_budget_year_idx").on(t.budgetYear)],
);

/** legacy: permission_permission */
export const permissionPermissions = mysqlTable("permission_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: int("p1").default(0).notNull(),
  p2: int("p2").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
});

/** legacy: meeting_room */
export const meetingRooms = mysqlTable(
  "meeting_rooms",
  {
    id: int("id").autoincrement().primaryKey(),
    roomCode: int("room_code").notNull(),
    roomName: varchar("room_name", { length: 100 }).notNull(),
    active: boolean("active").default(false).notNull(),
  },
  (t) => [uniqueIndex("meeting_rooms_room_code_idx").on(t.roomCode)],
);

/** legacy: meeting_permission */
export const meetingPermissions = mysqlTable("meeting_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: int("p1").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
});

/** legacy: meeting_main */
export const meetingBookings = mysqlTable(
  "meeting_bookings",
  {
    id: int("id").autoincrement().primaryKey(),
    roomCode: int("room_code").notNull(),
    bookDate: date("book_date", { mode: "string" }).notNull(),
    bookDateEnd: date("book_date_end", { mode: "string" }).notNull(),
    startTime: int("start_time").notNull(),
    finishTime: int("finish_time").notNull(),
    objective: varchar("objective", { length: 200 }).notNull(),
    personNum: int("person_num"),
    other: varchar("other", { length: 200 }),
    bookPersonId: varchar("book_person_id", { length: 13 }).notNull(),
    recDate: timestamp("rec_date").defaultNow().notNull(),
    approve: int("approve"),
    reason: varchar("reason", { length: 200 }),
    officerPersonId: varchar("officer_person_id", { length: 13 }),
    officerDate: timestamp("officer_date"),
  },
  (t) => [
    index("meeting_bookings_room_code_idx").on(t.roomCode),
    index("meeting_bookings_book_date_idx").on(t.bookDate),
    index("meeting_bookings_book_person_id_idx").on(t.bookPersonId),
  ],
);

/** legacy: permission_main */
export const permissionRequests = mysqlTable(
  "permission_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    refId: varchar("ref_id", { length: 50 }).notNull(),
    schoolId: int("school_id").references(() => schools.id),
    subject: varchar("subject", { length: 150 }).notNull(),
    place: varchar("place", { length: 150 }).notNull(),
    travelStart: date("travel_start", { mode: "string" }).notNull(),
    travelFinish: date("travel_finish", { mode: "string" }).notNull(),
    vehicle: varchar("vehicle", { length: 150 }),
    document: varchar("document", { length: 150 }),
    grantStatus: int("grant_status"),
    grantComment: varchar("grant_comment", { length: 200 }),
    grantPersonId: varchar("grant_person_id", { length: 13 }),
    grantDate: timestamp("grant_date"),
    groupGrant: int("group_grant"),
    groupComment: varchar("group_comment", { length: 200 }),
    groupDate: timestamp("group_date"),
    basicGrant: int("basic_grant"),
    basicComment: varchar("basic_comment", { length: 200 }),
    basicDate: timestamp("basic_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("permission_requests_ref_id_idx").on(t.refId),
    index("permission_requests_person_id_idx").on(t.personId),
    index("permission_requests_school_id_idx").on(t.schoolId),
    index("permission_requests_travel_start_idx").on(t.travelStart),
  ],
);

/** permission request attached files */
export const permissionRequestFiles = mysqlTable(
  "permission_request_files",
  {
    id: int("id").autoincrement().primaryKey(),
    requestId: int("request_id")
      .notNull()
      .references(() => permissionRequests.id),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileDes: varchar("file_des", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("permission_request_files_request_id_idx").on(t.requestId)],
);

/** legacy: car_type */

export const carTypes = mysqlTable(
  "car_types",
  {
    id: int("id").autoincrement().primaryKey(),
    code: int("code").notNull(),
    name: varchar("name", { length: 250 }).notNull(),
  },
  (t) => [uniqueIndex("car_types_code_idx").on(t.code)],
);

/** legacy: car_car */
export const carVehicles = mysqlTable(
  "car_vehicles",
  {
    id: int("id").autoincrement().primaryKey(),
    carCode: int("car_code").notNull(),
    carTypeCode: int("car_type_code").notNull(),
    carNumber: varchar("car_number", { length: 100 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    pic: varchar("pic", { length: 150 }),
    status: int("status").default(2).notNull(),
  },
  (t) => [uniqueIndex("car_vehicles_car_code_idx").on(t.carCode)],
);

/** legacy: car_driver */
export const carDrivers = mysqlTable(
  "car_drivers",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    status: int("status").default(0).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }),
    recDate: date("rec_date", { mode: "string" }),
  },
  (t) => [index("car_drivers_person_id_idx").on(t.personId)],
);

/** legacy: car_permission */
export const carPermissions = mysqlTable("car_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: int("p1").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
});

/** legacy: affair_main */
export const affairEntries = mysqlTable(
  "affair_entries",
  {
    id: int("id").autoincrement().primaryKey(),
    affairDate: date("affair_date", { mode: "string" }).notNull(),
    affairTime: varchar("affair_time", { length: 50 }).notNull(),
    subject: varchar("subject", { length: 150 }).notNull(),
    location: varchar("location", { length: 150 }).notNull(),
    operationPersonId: varchar("operation_person_id", { length: 13 }).notNull(),
    remark: varchar("remark", { length: 150 }),
    recDate: date("rec_date", { mode: "string" }).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }).notNull(),
  },
  (t) => [
    index("affair_entries_affair_date_idx").on(t.affairDate),
    index("affair_entries_operation_person_id_idx").on(t.operationPersonId),
  ],
);

/** legacy: affair_permission */
export const affairPermissions = mysqlTable("affair_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: int("p1").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
  recDate: date("rec_date", { mode: "string" }),
});

/** legacy: cabinet_main (v1 flat document store) */
export const cabinetDocuments = mysqlTable(
  "cabinet_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    fileId: int("file_id").default(1).notNull(),
    trayId: int("tray_id").default(1).notNull(),
    cabinetId: int("cabinet_id").default(1).notNull(),
    cabinetType: int("cabinet_type").default(1).notNull(),
    docSubject: varchar("doc_subject", { length: 150 }).notNull(),
    docSize: float("doc_size").notNull(),
    docName: varchar("doc_name", { length: 255 }).notNull(),
    docType: varchar("doc_type", { length: 10 }).notNull(),
    status: int("status").default(0).notNull(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    recDate: timestamp("rec_date").defaultNow().notNull(),
  },
  (t) => [
    index("cabinet_documents_person_id_idx").on(t.personId),
    index("cabinet_documents_rec_date_idx").on(t.recDate),
    index("cabinet_documents_doc_subject_idx").on(t.docSubject),
  ],
);

/** legacy: cabinet_permission */
export const cabinetPermissions = mysqlTable("cabinet_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: int("p1").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
  recDate: date("rec_date", { mode: "string" }),
});

/** legacy: news_mainitem */
export const newsMainitems = mysqlTable(
  "news_mainitems",
  {
    id: int("id").autoincrement().primaryKey(),
    code: int("code").notNull(),
    mainitem: varchar("mainitem", { length: 150 }).notNull(),
    itemActive: boolean("item_active").default(false).notNull(),
  },
  (t) => [uniqueIndex("news_mainitems_code_idx").on(t.code)],
);

/** legacy: news_section */
export const newsSections = mysqlTable(
  "news_sections",
  {
    id: int("id").autoincrement().primaryKey(),
    code: int("code").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    mainitemCode: int("mainitem_code").notNull(),
  },
  (t) => [
    uniqueIndex("news_sections_mainitem_code_idx").on(t.mainitemCode, t.code),
  ],
);

/** legacy: news_news */
export const newsArticles = mysqlTable(
  "news_articles",
  {
    id: int("id").autoincrement().primaryKey(),
    reportDate: timestamp("report_date").defaultNow().notNull(),
    news: varchar("news", { length: 250 }).notNull(),
    file: varchar("file", { length: 255 }),
    sectionCode: int("section_code").notNull(),
    mainitemCode: int("mainitem_code").notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }).notNull(),
  },
  (t) => [
    index("news_articles_mainitem_code_idx").on(t.mainitemCode),
    index("news_articles_section_code_idx").on(t.sectionCode),
    index("news_articles_report_date_idx").on(t.reportDate),
  ],
);

/** legacy: news_permission */
export const newsPermissions = mysqlTable("news_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: int("p1").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
  recDate: date("rec_date", { mode: "string" }),
});

/** legacy: car_main */
export const carRequests = mysqlTable(
  "car_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    recDate: date("rec_date", { mode: "string" }).notNull(),
    carCode: int("car_code").notNull(),
    place: varchar("place", { length: 200 }).notNull(),
    because: varchar("because", { length: 200 }).notNull(),
    carStart: date("car_start", { mode: "string" }).notNull(),
    timeStart: float("time_start"),
    carFinish: date("car_finish", { mode: "string" }).notNull(),
    timeFinish: float("time_finish"),
    dayTotal: int("day_total"),
    personNum: int("person_num"),
    controlPerson: varchar("control_person", { length: 100 }),
    fuel: int("fuel").notNull(),
    project: varchar("project", { length: 100 }),
    activity: varchar("activity", { length: 100 }),
    money: float("money"),
    selfDriver: int("self_driver"),
    privateCar: int("private_car"),
    carOwner: varchar("car_owner", { length: 100 }),
    privateCarNumber: varchar("private_car_number", { length: 100 }),
    privateDriver: varchar("private_driver", { length: 100 }),
    driverPersonId: varchar("driver_person_id", { length: 13 }),
    officerComment: varchar("officer_comment", { length: 150 }),
    officerSignPersonId: varchar("officer_sign_person_id", { length: 13 }),
    officerDate: timestamp("officer_date"),
    groupComment: varchar("group_comment", { length: 150 }),
    groupSignPersonId: varchar("group_sign_person_id", { length: 13 }),
    groupDate: timestamp("group_date"),
    grantComment: varchar("grant_comment", { length: 150 }),
    commanderGrant: int("commander_grant"),
    commanderSignPersonId: varchar("commander_sign_person_id", { length: 13 }),
    commanderDate: timestamp("commander_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("car_requests_person_id_idx").on(t.personId),
    index("car_requests_car_start_idx").on(t.carStart),
  ],
);

/** legacy: achievement_permission */
export const achievementPermissions = mysqlTable("achievement_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: int("p1").default(0).notNull(),
  p2: int("p2").default(0).notNull(),
  p3: int("p3").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
});

/** legacy: achievement_main */
export const achievementScores = mysqlTable(
  "achievement_scores",
  {
    id: int("id").autoincrement().primaryKey(),
    testType: int("test_type").notNull(),
    testClass: int("test_class").notNull(),
    edYear: int("ed_year").notNull(),
    schoolCode: varchar("school_code", { length: 12 }).notNull(),
    thai: float("thai").default(0).notNull(),
    math: float("math").default(0).notNull(),
    science: float("science").default(0).notNull(),
    social: float("social").default(0).notNull(),
    english: float("english").default(0).notNull(),
    health: float("health").default(0).notNull(),
    art: float("art").default(0).notNull(),
    vocation: float("vocation").default(0).notNull(),
    scoreAvg: float("score_avg").default(0).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }),
    recDate: date("rec_date", { mode: "string" }),
  },
  (t) => [
    index("achievement_scores_ed_year_idx").on(t.edYear),
    index("achievement_scores_school_code_idx").on(t.schoolCode),
    uniqueIndex("achievement_scores_unique_idx").on(
      t.testType,
      t.testClass,
      t.edYear,
      t.schoolCode,
    ),
  ],
);

/** legacy: student_main_edyear */
export const studentEdYears = mysqlTable(
  "student_ed_years",
  {
    id: int("id").autoincrement().primaryKey(),
    edYear: int("ed_year").notNull(),
    yearActive: boolean("year_active").default(false).notNull(),
  },
  (t) => [uniqueIndex("student_ed_years_ed_year_idx").on(t.edYear)],
);

/** legacy: student_main_permission */
export const studentPermissions = mysqlTable(
  "student_permissions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: int("school_id").references(() => schools.id),
    p1: int("p1").default(0).notNull(),
    p2: int("p2").default(0).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }),
  },
  (t) => [
    uniqueIndex("student_permissions_user_school_idx").on(t.userId, t.schoolId),
  ],
);

/** legacy: student_main_main */
export const students = mysqlTable(
  "students",
  {
    id: int("id").autoincrement().primaryKey(),
    edYear: int("ed_year").notNull(),
    refId: varchar("ref_id", { length: 20 }).notNull(),
    schoolCode: varchar("school_code", { length: 15 }).notNull(),
    studentId: varchar("student_id", { length: 15 }).notNull(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    prename: varchar("prename", { length: 20 }).notNull(),
    name: varchar("name", { length: 50 }).notNull(),
    surname: varchar("surname", { length: 50 }).notNull(),
    sex: varchar("sex", { length: 5 }).notNull(),
    schoolName: varchar("school_name", { length: 150 }).notNull(),
    classLevel: int("class_level").notNull(),
    classroom: int("classroom").default(1).notNull(),
    disable: int("disable").default(0).notNull(),
    status: int("status").default(0).notNull(),
    recDate: date("rec_date", { mode: "string" }).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }).notNull(),
  },
  (t) => [
    index("students_ed_year_idx").on(t.edYear),
    index("students_school_code_idx").on(t.schoolCode),
    index("students_person_id_idx").on(t.personId),
    uniqueIndex("students_ed_year_school_student_idx").on(
      t.edYear,
      t.schoolCode,
      t.studentId,
    ),
  ],
);

/** legacy: spacial_student_permission */
export const spacialStudentPermissions = mysqlTable(
  "spacial_student_permissions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: int("school_id").references(() => schools.id),
    p1: int("p1").default(0).notNull(),
    p2: int("p2").default(0).notNull(),
    p3: int("p3").default(0).notNull(),
    classLevel: varchar("class_level", { length: 2 }),
    officerPersonId: varchar("officer_person_id", { length: 13 }),
  },
  (t) => [
    uniqueIndex("spacial_student_permissions_user_school_idx").on(
      t.userId,
      t.schoolId,
    ),
  ],
);

/** legacy: spacial_student_disabled */
export const spacialStudentDisabled = mysqlTable(
  "spacial_student_disabled",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    schoolCode: varchar("school_code", { length: 15 }).notNull(),
    disableType: int("disable_type").default(0).notNull(),
    disableDetail: text("disable_detail").default("").notNull(),
    other: text("other").default("").notNull(),
    pic: varchar("pic", { length: 150 }).default("").notNull(),
    status: int("status").default(0).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }).notNull(),
    recDate: date("rec_date", { mode: "string" }).notNull(),
  },
  (t) => [
    index("spacial_student_disabled_school_code_idx").on(t.schoolCode),
    index("spacial_student_disabled_person_id_idx").on(t.personId),
    uniqueIndex("spacial_student_disabled_person_school_idx").on(
      t.personId,
      t.schoolCode,
    ),
  ],
);

/** legacy: plan_year */
export const planYears = mysqlTable(
  "plan_years",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    yearActive: boolean("year_active").default(false).notNull(),
  },
  (t) => [uniqueIndex("plan_years_budget_year_idx").on(t.budgetYear)],
);

/** legacy: plan_proj */
export const planProjects = mysqlTable(
  "plan_projects",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    codeClus: int("code_clus").notNull(),
    codeTegy: varchar("code_tegy", { length: 1 }).default("1").notNull(),
    codeProj: varchar("code_proj", { length: 3 }).notNull(),
    budgetProj: float("budget_proj").default(0).notNull(),
    nameProj: varchar("name_proj", { length: 100 }).notNull(),
    ownerProj: varchar("owner_proj", { length: 13 }).default("").notNull(),
    beginDate: date("begin_date", { mode: "string" }).notNull(),
    finishDate: date("finish_date", { mode: "string" }).notNull(),
    fileDetail: varchar("file_detail", { length: 255 }),
    dayrec: timestamp("dayrec"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("plan_projects_year_code_idx").on(t.budgetYear, t.codeProj),
    index("plan_projects_budget_year_idx").on(t.budgetYear),
    index("plan_projects_code_clus_idx").on(t.codeClus),
  ],
);

/** legacy: plan_acti */
export const planActivities = mysqlTable(
  "plan_activities",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    codeClus: int("code_clus").notNull(),
    codeProj: varchar("code_proj", { length: 3 }).notNull(),
    codeActi: varchar("code_acti", { length: 6 }).notNull(),
    codeApprove: varchar("code_approve", { length: 6 }).default("").notNull(),
    budgetActi: float("budget_acti").default(0).notNull(),
    nameActi: varchar("name_acti", { length: 100 }).notNull(),
    ownerActi: varchar("owner_acti", { length: 13 }).default("").notNull(),
    beginDate: date("begin_date", { mode: "string" }).notNull(),
    finishDate: date("finish_date", { mode: "string" }).notNull(),
    stop: int("stop"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("plan_activities_year_code_idx").on(t.budgetYear, t.codeActi),
    index("plan_activities_proj_idx").on(t.budgetYear, t.codeProj),
  ],
);

/** legacy: budget_year */
export const budgetYears = mysqlTable(
  "budget_years",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    yearActive: boolean("year_active").default(false).notNull(),
  },
  (t) => [uniqueIndex("budget_years_budget_year_idx").on(t.budgetYear)],
);

/** legacy: budget_permission */
export const budgetPermissions = mysqlTable(
  "budget_permissions",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    p1: int("p1").default(0).notNull(),
    p2: int("p2").default(0).notNull(),
    p3: int("p3").default(0).notNull(),
    p4: int("p4").default(0).notNull(),
    p5: int("p5").default(0).notNull(),
    p6: int("p6").default(0).notNull(),
    p7: int("p7").default(0).notNull(),
    p8: int("p8").default(0).notNull(),
    p9: int("p9").default(0).notNull(),
    p10: int("p10").default(0).notNull(),
    officer: varchar("officer", { length: 13 }).notNull(),
    recDate: date("rec_date", { mode: "string" }).notNull(),
  },
  (t) => [uniqueIndex("budget_permissions_person_id_idx").on(t.personId)],
);

/** legacy: budget_plan */
export const budgetPlans = mysqlTable(
  "budget_plans",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    code: varchar("code", { length: 10 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
  },
  (t) => [index("budget_plans_budget_year_idx").on(t.budgetYear)],
);

/** legacy: budget_project */
export const budgetProjectProducts = mysqlTable(
  "budget_project_products",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
  },
  (t) => [index("budget_project_products_budget_year_idx").on(t.budgetYear)],
);

/** legacy: budget_key_activity */
export const budgetKeyActivities = mysqlTable(
  "budget_key_activities",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
  },
  (t) => [index("budget_key_activities_budget_year_idx").on(t.budgetYear)],
);

/** legacy: budget_money_source */
export const budgetMoneySources = mysqlTable(
  "budget_money_sources",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
  },
  (t) => [index("budget_money_sources_budget_year_idx").on(t.budgetYear)],
);

/** legacy: budget_receive */
export const budgetReceives = mysqlTable(
  "budget_receives",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    num: double("num").notNull().default(0),
    bookNumber: varchar("book_number", { length: 100 }).default(""),
    outDate: varchar("out_date", { length: 100 }).default(""),
    bookRef: varchar("book_ref", { length: 100 }).default(""),
    plan: varchar("plan", { length: 20 }).default(""),
    project: varchar("project", { length: 50 }).default(""),
    activity: varchar("activity", { length: 100 }).default(""),
    activity2: varchar("activity2", { length: 255 }).default(""),
    mSource: varchar("m_source", { length: 20 }).default(""),
    account: varchar("account", { length: 50 }).default(""),
    mPay: varchar("m_pay", { length: 20 }).default(""),
    item: varchar("item", { length: 255 }).notNull().default(""),
    detail: text("detail"),
    money: double("money").notNull().default(0),
    file: varchar("file", { length: 255 }).default(""),
    recDate: date("rec_date", { mode: "string" }),
    officer: varchar("officer", { length: 20 }).default(""),
  },
  (t) => [index("budget_receives_year_idx").on(t.budgetYear)],
);

/** legacy: budget_category */
export const budgetCategories = mysqlTable("budget_categories", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("category_id").notNull(),
  categoryName: varchar("category_name", { length: 100 }).notNull(),
});

/** legacy: budget_pay_type */
export const budgetPayTypes = mysqlTable("budget_pay_types", {
  id: int("id").autoincrement().primaryKey(),
  payTypeId: int("pay_type_id").notNull(),
  payGroupId: int("pay_group_id").notNull(),
  payTypeName: varchar("pay_type_name", { length: 100 }).notNull(),
});

/** legacy: budget_main — ทะเบียนรับ/จ่ายหลัก */
export const budgetMain = mysqlTable(
  "budget_main",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    doc: varchar("doc", { length: 30 }).notNull(),
    referWdId: int("refer_wd_id"),
    referDeegaId: int("refer_deega_id"),
    typeId: int("type_id").notNull(),
    item: varchar("item", { length: 100 }).notNull(),
    receiveAmount: float("receive_amount"),
    payAmount: float("pay_amount"),
    payedPerson: varchar("payed_person", { length: 50 }),
    changeAmount: float("change_amount"),
    payGroup: int("pay_group"),
    status: int("status"),
    recDate: date("rec_date", { mode: "string" }).notNull(),
    officer: varchar("officer", { length: 13 }),
    approveDate: date("approve_date", { mode: "string" }),
    approve: int("approve"),
    approveName: varchar("approve_name", { length: 13 }),
    payDate: date("pay_date", { mode: "string" }),
    checkNumber: varchar("check_number", { length: 30 }),
    payee: varchar("payee", { length: 50 }),
    payer: varchar("payer", { length: 13 }),
    plan: varchar("plan", { length: 100 }),
    project: varchar("project", { length: 100 }),
    activity: varchar("activity", { length: 100 }),
    money: float("money"),
    deegaNum: varchar("deega_num", { length: 30 }),
    receiveNum: varchar("receive_num", { length: 30 }),
    withdraw: float("withdraw"),
    tax: float("tax"),
    pay: float("pay"),
    directPay: int("direct_pay"),
    directPayName: varchar("direct_pay_name", { length: 100 }),
  },
  (t) => [
    index("budget_main_budget_year_idx").on(t.budgetYear),
    index("budget_main_type_id_idx").on(t.typeId),
    index("budget_main_rec_date_idx").on(t.recDate),
  ],
);

/** legacy: budget_types */
export const budgetType = mysqlTable(
  "budget_types",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    typeId: int("type_id").notNull(),
    typeName: varchar("type_name", { length: 100 }).notNull(),
    categoryId: int("category_id").notNull(),
  },
  (t) => [
    index("budget_types_budget_year_idx").on(t.budgetYear),
    index("budget_types_category_id_idx").on(t.categoryId),
  ],
);

/** legacy: idocument_main */
export const idocumentMain = mysqlTable(
  "idocument_main",
  {
    id: int("id").autoincrement().primaryKey(),
    workgroup: int("workgroup").notNull(),
    workgroupTxt: text("workgroup_txt").notNull(),
    bookYear: int("book_year").notNull(),
    bookNumber: int("book_number").notNull(),
    bookNo: varchar("book_no", { length: 50 }).notNull(),
    bookDate: date("book_date", { mode: "string" }).notNull(),
    subject: text("subject").notNull(),
    preDocId: varchar("pre_doc_id", { length: 100 }).notNull(),
    bookTo: varchar("book_to", { length: 255 }).notNull(),
    content1: text("content1").notNull(),
    content2: text("content2").notNull(),
    content3: text("content3").notNull(),
    officer: varchar("officer", { length: 20 }).notNull(),
    officerName: varchar("officer_name", { length: 255 }).notNull(),
    officerPosition: varchar("officer_position", { length: 255 }).notNull(),
    bookStatus: int("book_status").notNull(),
    bookType: int("book_type").notNull(),
  },
  (t) => [
    index("idocument_main_officer_idx").on(t.officer),
    index("idocument_main_book_year_number_idx").on(t.bookYear, t.bookNumber),
    index("idocument_main_book_status_idx").on(t.bookStatus),
  ],
);

/** legacy: idocument_sendto */
export const idocumentSendto = mysqlTable(
  "idocument_sendto",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("document_id").notNull(),
    recId: varchar("rec_id", { length: 50 }).notNull(),
    recFrom: varchar("rec_from", { length: 25 }),
    personId: varchar("person_id", { length: 20 }).notNull(),
    sendTime: timestamp("send_time").defaultNow().notNull(),
    openTime: timestamp("open_time"),
    documentFrom: varchar("document_from", { length: 50 }),
    status: int("status"),
  },
  (t) => [
    index("idocument_sendto_person_status_idx").on(t.personId, t.status),
    index("idocument_sendto_document_id_idx").on(t.documentId),
  ],
);

/** legacy: idocument_comment */
export const idocumentComment = mysqlTable(
  "idocument_comment",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("document_id").notNull(),
    recId: varchar("rec_id", { length: 100 }).notNull(),
    personCommentsId: varchar("person_comments_id", { length: 20 }).notNull(),
    personCommentsName: varchar("person_comments_name", { length: 255 }).notNull(),
    personCommentsPosition: varchar("person_comments_position", {
      length: 255,
    }).notNull(),
    commentsSelect: varchar("comments_select", { length: 100 }),
    commentsTxt: varchar("comments_txt", { length: 255 }),
    commentsEtctxt: varchar("comments_etctxt", { length: 255 }),
    commentsDate: timestamp("comments_date").defaultNow().notNull(),
    commentsType: int("comments_type"),
    commentsStatus: int("comments_status"),
  },
  (t) => [index("idocument_comment_document_id_idx").on(t.documentId)],
);

/** legacy: idocument_files */
export const idocumentFiles = mysqlTable(
  "idocument_files",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("document_id"),
    fileName: varchar("file_name", { length: 255 }),
    fileDes: varchar("file_des", { length: 255 }),
    filetype: varchar("filetype", { length: 5 }),
    docType: varchar("docType", { length: 10 }),
  },
  (t) => [index("idocument_files_document_id_idx").on(t.documentId)],
);

/** legacy: permission_person_settings */
export const permissionPersonSettings = mysqlTable(
  "permission_person_settings",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    groupPersonId: varchar("group_person_id", { length: 13 }),
    grantPersonId: varchar("grant_person_id", { length: 13 }),
  },
  (t) => [uniqueIndex("permission_person_settings_person_id_idx").on(t.personId)],
);

/** legacy: plan_permissions */
export const planPermissions = mysqlTable(
  "plan_permissions",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    permAdd: int("perm_add").default(0).notNull(),
    permEdit: int("perm_edit").default(0).notNull(),
    permDele: int("perm_dele").default(0).notNull(),
    officer: varchar("officer", { length: 13 }).default("").notNull(),
    recDate: date("rec_date", { mode: "string" }).notNull(),
  },
  (t) => [uniqueIndex("plan_permissions_person_id_idx").on(t.personId)],
);

/** legacy: plan_strategies */
export const planStrategies = mysqlTable(
  "plan_strategies",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    codeTegy: varchar("code_tegy", { length: 10 }).notNull(),
    nameTegy: varchar("name_tegy", { length: 255 }).notNull(),
    idTegic: varchar("id_tegic", { length: 10 }),
    strategic: varchar("strategic", { length: 255 }),
  },
  (t) => [uniqueIndex("plan_strategies_year_code_idx").on(t.budgetYear, t.codeTegy)],
);

export const PLAN_PROJECT_KIND = {
  annual: "annual",
  surplus: "surplus",
} as const;

/** legacy: system_sync_code */
export const systemSyncCode = mysqlTable(
  "system_sync_code",
  {
    id: int("id").autoincrement().primaryKey(),
    officeCode: varchar("office_code", { length: 10 }).notNull(),
    syncCode: varchar("sync_code", { length: 100 }).notNull(),
    smssUrl: varchar("smss_url", { length: 255 }),
  },
  (t) => [uniqueIndex("system_sync_code_office_code_idx").on(t.officeCode)],
);

/** legacy: bookobec_permissions */
export const bookobecPermissions = mysqlTable(
  "bookobec_permissions",
  {
    id: int("id").autoincrement().primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    userId: int("user_id").notNull().default(0),
    p1: int("p1").default(0).notNull(),
    p2: int("p2").default(0).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }),
    permAdd: int("perm_add").default(0).notNull(),
    permEdit: int("perm_edit").default(0).notNull(),
    permDele: int("perm_dele").default(0).notNull(),
  },
  (t) => [
    uniqueIndex("bookobec_permissions_person_id_idx").on(t.personId),
    index("bookobec_permissions_user_id_idx").on(t.userId),
  ],
);

export const budgetWithdraw = mysqlTable(
  "budget_withdraw",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year"),
    document: varchar("document", { length: 30 }).notNull(),
    item: varchar("item", { length: 100 }).notNull(),
    pjActivity: varchar("pj_activity", { length: 20 }).notNull(),
    money: double("money").notNull(),
    payType: varchar("pay_type", { length: 10 }).notNull(),
    pRequest: varchar("p_request", { length: 50 }).notNull(),
    borrowStatus: tinyint("borrow_status").default(0),
    withdrawStatus: tinyint("withdraw_status").notNull().default(0),
    deega: float("deega"),
    officer: varchar("officer", { length: 13 }).notNull(),
    recDate: date("rec_date", { mode: "string" }).notNull(),
    borrowedRecDate: date("borrowed_rec_date", { mode: "string" }).notNull(),
    withdrawRecDate: date("withdraw_rec_date", { mode: "string" }).notNull(),
    status: tinyint("status").notNull().default(0),
  },
  (t) => [
    index("budget_withdraw_budget_year_idx").on(t.budgetYear),
    index("budget_withdraw_rec_date_idx").on(t.recDate),
  ],
);
export const budgetDeegaTable = mysqlTable(
  "budget_deega",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    deegaNum: float("deega_num"),
    doc: varchar("doc", { length: 20 }).notNull().default(""),
    receiveNum: varchar("receive_num", { length: 5 }).notNull().default(""),
    plan: varchar("plan", { length: 5 }).notNull().default(""),
    project: varchar("project", { length: 20 }).notNull().default(""),
    activity: varchar("activity", { length: 20 }).notNull().default(""),
    payGroup: int("pay_group"),
    item: varchar("item", { length: 50 }).notNull().default(""),
    withdraw: double("withdraw").notNull().default(0),
    tax: double("tax").notNull().default(0),
    pay: double("pay").notNull().default(0),
    officer: varchar("officer", { length: 13 }),
    recDate: date("rec_date"),
    status: tinyint("status").notNull().default(0),
    directPay: int("direct_pay").notNull().default(0),
    directPayName: varchar("direct_pay_name", { length: 200 }).notNull().default(""),
  },
  (t) => [
    index("budget_deega_budget_year_idx").on(t.budgetYear),
    index("budget_deega_rec_date_idx").on(t.recDate),
  ],
);
/** legacy alias kept for workflow-actions compatibility */
export const budgetDeega = budgetDeegaTable;
export const budgetReceive = budgetMain;
export const budgetCancelDeega = budgetMain;
export const budgetMoneyReturn = mysqlTable(
  "budget_money_return",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year"),
    document: varchar("document", { length: 30 }).notNull().default(""),
    item: varchar("item", { length: 100 }).notNull().default(""),
    pjActivity: varchar("pj_activity", { length: 20 }).notNull().default(""),
    money: double("money").notNull().default(0),
    payType: varchar("pay_type", { length: 10 }).notNull(),
    pRequest: varchar("p_request", { length: 13 }).notNull(),
    officer: varchar("officer", { length: 13 }).notNull().default(""),
    recDate: date("rec_date", { mode: "string" }).notNull(),
  },
  (t) => [
    index("budget_money_return_budget_year_idx").on(t.budgetYear),
    index("budget_money_return_rec_date_idx").on(t.recDate),
  ],
);

export const budgetReturnDeega = mysqlTable(
  "budget_return_deega",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    document: varchar("document", { length: 50 }),
    receiveNum: varchar("receive_num", { length: 50 }),
    plan: varchar("plan", { length: 50 }),
    project: varchar("project", { length: 50 }),
    activity: varchar("activity", { length: 50 }),
    payGroup: int("pay_group"),
    item: varchar("item", { length: 255 }),
    money: double("money").notNull().default(0),
    officer: varchar("officer", { length: 20 }),
    recDate: date("rec_date", { mode: "string" }),
  },
  (t) => [
    index("budget_return_deega_budget_year_idx").on(t.budgetYear),
  ],
);
export const budgetReserveMoneyTable = mysqlTable(
  "budget_reserve_money",
  {
    id: int("id").autoincrement().primaryKey(),
    budgetYear: int("budget_year").notNull(),
    item: varchar("item", { length: 250 }),
    payAmount: float("pay_amount").default(0),
    receiveAmount: float("receive_amount").default(0),
    payRecDate: date("pay_rec_date", { mode: "string" }),
    borrowedPerson: varchar("borrowed_person", { length: 150 }),
  },
  (t) => [
    index("budget_reserve_money_year_idx").on(t.budgetYear),
  ],
);
export const budgetPo = budgetMain;
export const budgetReserveMoney = budgetReserveMoneyTable;

export const budgetProject = mysqlTable("budget_project", {
  id: int("id").autoincrement().primaryKey(),
  budgetYear: int("budget_year").notNull(),
  code: varchar("code", { length: 20 }).notNull().default(""),
  name: varchar("name", { length: 80 }).notNull(),
});

export const budgetKeyActivity = mysqlTable("budget_key_activity", {
  id: int("id").autoincrement().primaryKey(),
  budgetYear: int("budget_year").notNull(),
  code: varchar("code", { length: 20 }).notNull().default(""),
  name: varchar("name", { length: 100 }).notNull().default(""),
});

export const systemWorkgroups = mysqlTable("system_workgroup", {
  id: int("id").autoincrement().primaryKey(),
  workgroup: int("workgroup").notNull(),
  workgroupDesc: varchar("workgroup_desc", { length: 100 }).notNull(),
});

export const allowedIps = mysqlTable("allowed_ips", {
  id: int("id").autoincrement().primaryKey(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  description: varchar("description", { length: 255 }),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  uniqueIndex("allowed_ips_ip_address_idx").on(t.ipAddress),
]);

