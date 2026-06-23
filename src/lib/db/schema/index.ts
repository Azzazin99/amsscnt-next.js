import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const organizationTypeEnum = pgEnum("organization_type", [
  "district",
  "school",
]);

export const districtSettings = pgTable("district_settings", {
  id: serial("id").primaryKey(),
  officeName: varchar("office_name", { length: 255 }).notNull(),
  officeCode: varchar("office_code", { length: 10 }).notNull().default("1701"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workgroups = pgTable("workgroups", {
  id: serial("id").primaryKey(),
  legacyCode: integer("legacy_code"),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
});

export const schoolGroups = pgTable("school_groups", {
  id: serial("id").primaryKey(),
  legacyId: integer("legacy_id"),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const schools = pgTable(
  "schools",
  {
    id: serial("id").primaryKey(),
    schoolCode: varchar("school_code", { length: 12 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    schoolType: integer("school_type").default(0).notNull(),
    schoolGroupId: integer("school_group_id").references(() => schoolGroups.id),
    active: boolean("active").default(true).notNull(),
  },
  (t) => [uniqueIndex("schools_school_code_idx").on(t.schoolCode)],
);

export const people = pgTable(
  "people",
  {
    id: serial("id").primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    prefix: varchar("prefix", { length: 50 }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    workgroupId: integer("workgroup_id").references(() => workgroups.id),
    schoolId: integer("school_id").references(() => schools.id),
    organizationType: organizationTypeEnum("organization_type")
      .notNull()
      .default("district"),
    positionCode: integer("position_code"),
    status: integer("status").default(0).notNull(),
    multiSchool: boolean("multi_school").default(false).notNull(),
    serviceStartDate: date("service_start_date"),
    sex: varchar("sex", { length: 1 }),
  },
  (t) => [
    uniqueIndex("people_person_id_idx").on(t.personId),
    index("people_org_status_idx").on(t.organizationType, t.status),
    index("people_school_status_idx").on(t.schoolId, t.status),
  ],
);

export const personSchoolAssignments = pgTable(
  "person_school_assignments",
  {
    id: serial("id").primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    schoolId: integer("school_id")
      .notNull()
      .references(() => schools.id),
  },
  (t) => [
    uniqueIndex("person_school_assignments_unique").on(t.personId, t.schoolId),
  ],
);

/** legacy: รักษาการในตำแหน่ง ผอ.รร. */
export const personDelegate = pgTable("person_delegate", {
  id: serial("id").primaryKey(),
  schoolCode: varchar("school_code", { length: 11 }).notNull(),
  personId: varchar("person_id", { length: 13 }).notNull(),
  start: date("start").notNull(),
  finish: date("finish").notNull(),
  remark: varchar("remark", { length: 250 }).notNull(),
  officer: varchar("officer", { length: 13 }).notNull(),
  recDate: date("rec_date").notNull(),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 100 }).notNull(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    organizationType: organizationTypeEnum("organization_type")
      .notNull()
      .default("district"),
    schoolId: integer("school_id").references(() => schools.id),
    isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    status: integer("status").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("users_username_idx").on(t.username),
    uniqueIndex("users_person_id_idx").on(t.personId),
  ],
);

export const menuGroups = pgTable("menu_groups", {
  id: serial("id").primaryKey(),
  legacyId: integer("legacy_id"),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  menuGroupId: integer("menu_group_id").references(() => menuGroups.id),
  whereWork: integer("where_work").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const moduleAdmins = pgTable(
  "module_admins",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    moduleSlug: varchar("module_slug", { length: 64 }).notNull(),
    assignedAt: date("assigned_at"),
    assignedBy: integer("assigned_by").references(() => users.id),
  },
  (t) => [
    uniqueIndex("module_admins_user_module_idx").on(t.userId, t.moduleSlug),
  ],
);

export const registerPermissions = pgTable("register_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: integer("p1").default(0).notNull(),
  p2: integer("p2").default(0).notNull(),
  p3: integer("p3").default(0).notNull(),
  canViewSecret: boolean("can_view_secret").default(false).notNull(),
});

/** legacy: person_permission — สิทธิ์โมดูลบุคลากร p1/p2/p3 */
export const personPermissions = pgTable("person_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: integer("p1").default(0).notNull(),
  p2: integer("p2").default(0).notNull(),
  p3: integer("p3").default(0).notNull(),
});

export const registerYears = pgTable(
  "register_years",
  {
    id: serial("id").primaryKey(),
    year: integer("year").notNull(),
    schoolId: integer("school_id").references(() => schools.id),
    yearActive: boolean("year_active").default(false).notNull(),
    startReceiveNum: integer("start_receive_num").default(1).notNull(),
    startSendNum: integer("start_send_num").default(1).notNull(),
    startCommandNum: integer("start_command_num").default(1).notNull(),
    startCertificateNum: integer("start_certificate_num").default(1).notNull(),
  },
  (t) => [
    uniqueIndex("register_years_year_school_idx").on(t.year, t.schoolId),
  ],
);

const registerBase = {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id),
  year: integer("year").notNull(),
  registerNumber: integer("register_number").notNull(),
  bookNo: varchar("book_no", { length: 100 }),
  signdate: date("signdate"),
  subject: text("subject"),
  comment: text("comment"),
  registerDate: date("register_date"),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  officerId: integer("officer_id").references(() => users.id),
  secret: boolean("secret").default(false).notNull(),
  urgencyLevel: integer("urgency_level").default(1).notNull(),
  secretLevel: integer("secret_level").default(0).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
};

export const registerReceives = pgTable(
  "register_receives",
  {
    ...registerBase,
    bookFrom: text("book_from"),
    bookTo: text("book_to"),
    operation: varchar("operation", { length: 255 }),
    workgroupId: integer("workgroup_id").references(() => workgroups.id),
    recordType: integer("record_type").default(1).notNull(),
    bookLink: integer("book_link").default(0).notNull(),
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

export const registerSends = pgTable(
  "register_sends",
  {
    ...registerBase,
    bookFrom: text("book_from"),
    bookTo: text("book_to"),
    operation: varchar("operation", { length: 255 }),
    workgroupId: integer("workgroup_id").references(() => workgroups.id),
    officeType: integer("office_type").default(1).notNull(),
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

export const registerCommands = pgTable(
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

export const registerCertificates = pgTable(
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

export const registerReceiveFiles = pgTable("register_receive_files", {
  id: serial("id").primaryKey(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileDes: varchar("file_des", { length: 255 }),
});

export const registerSendFiles = pgTable("register_send_files", {
  id: serial("id").primaryKey(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileDes: varchar("file_des", { length: 255 }),
});

/** legacy: bookregister_office_no — prefix เลขที่หนังสือออก เช่น "ที่ ศธ 04146/" */
export const registerOfficeNumbers = pgTable("bookregister_office_no", {
  id: serial("id").primaryKey(),
  officeNo: text("office_no").notNull(),
  schoolCode: varchar("school_code", { length: 12 }),
  officer: varchar("officer", { length: 13 }),
  recDate: date("rec_date"),
});

/** legacy: book_group — กลุ่มหนังสือ (ส่งถึงหลายโรงเรียน) */
export const bookGroups = pgTable("book_groups", {
  id: serial("id").primaryKey(),
  legacyId: integer("legacy_id"),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const bookGroupMembers = pgTable(
  "book_group_members",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => bookGroups.id, { onDelete: "cascade" }),
    schoolId: integer("school_id")
      .notNull()
      .references(() => schools.id),
  },
  (t) => [
    uniqueIndex("book_group_members_unique").on(t.groupId, t.schoolId),
  ],
);

/** legacy: book_main — หนังสือรับส่งอิเล็กทรอนิกส์ */
export const bookDocuments = pgTable(
  "book_documents",
  {
    id: serial("id").primaryKey(),
    refId: varchar("ref_id", { length: 64 }).notNull(),
    bookType: integer("book_type").notNull(),
    senderPersonId: varchar("sender_person_id", { length: 13 }).notNull(),
    officeCode: varchar("office_code", { length: 13 }).notNull(),
    senderSchoolId: integer("sender_school_id").references(() => schools.id),
    senderWorkgroupId: integer("sender_workgroup_id").references(
      () => workgroups.id,
    ),
    senderUserId: integer("sender_user_id").references(() => users.id),
    urgencyLevel: integer("urgency_level").default(1).notNull(),
    secretLevel: integer("secret_level").default(0).notNull(),
    bookNo: varchar("book_no", { length: 100 }).notNull(),
    signDate: date("sign_date").notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    detail: text("detail"),
    sendDate: timestamp("send_date").defaultNow().notNull(),
    bookRegisLink: integer("book_regis_link").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("book_documents_ref_id_idx").on(t.refId),
    index("book_documents_book_type_idx").on(t.bookType),
    index("book_documents_sender_school_idx").on(t.senderSchoolId),
  ],
);

/** legacy: book_sendto_answer — ผู้รับ/สถานะตอบรับ */
export const bookRecipients = pgTable(
  "book_recipients",
  {
    id: serial("id").primaryKey(),
    refId: varchar("ref_id", { length: 64 }).notNull(),
    sendLevel: integer("send_level"),
    sendTo: varchar("send_to", { length: 32 }).notNull(),
    schoolScope: varchar("school_scope", { length: 32 }),
    status: integer("status"),
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
export const bookFiles = pgTable("book_files", {
  id: serial("id").primaryKey(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileDes: varchar("file_des", { length: 255 }),
});

/** นโยบายอายุเก็บหนังสือตามประเภท (book_type) — ค่าเริ่มต้น 2 ปี */
export const bookRetentionSettings = pgTable(
  "book_retention_settings",
  {
    id: serial("id").primaryKey(),
    bookType: integer("book_type").notNull(),
    retentionYears: integer("retention_years").default(2).notNull(),
  },
  (t) => [uniqueIndex("book_retention_settings_book_type_unique").on(t.bookType)],
);

/** legacy: book_permission — สิทธิ์โมดูลรับส่งหนังสือ */
export const bookPermissions = pgTable("book_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: integer("p1").default(0).notNull(),
  p2: integer("p2").default(0).notNull(),
  p3: integer("p3").default(0).notNull(),
  canViewSecret: boolean("can_view_secret").default(false).notNull(),
});

/** legacy: mail_group — กลุ่มบุคลากร (หนังสือเวียน) */
export const mailGroups = pgTable("mail_groups", {
  id: serial("id").primaryKey(),
  legacyId: integer("legacy_id"),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const mailGroupMembers = pgTable(
  "mail_group_members",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
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
export const mailDocuments = pgTable(
  "mail_documents",
  {
    id: serial("id").primaryKey(),
    refId: varchar("ref_id", { length: 64 }).notNull(),
    senderPersonId: varchar("sender_person_id", { length: 13 }).notNull(),
    senderUserId: integer("sender_user_id").references(() => users.id),
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
export const mailRecipients = pgTable(
  "mail_recipients",
  {
    id: serial("id").primaryKey(),
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
export const mailFiles = pgTable("mail_files", {
  id: serial("id").primaryKey(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileDes: varchar("file_des", { length: 255 }),
});

/** legacy: mail_permission — เจ้าหน้าที่หนังสือเวียน */
export const mailPermissions = pgTable("mail_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: integer("p1").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
  recDate: date("rec_date"),
});

/** legacy: la_year → leave_years */
export const leaveYears = pgTable(
  "leave_years",
  {
    id: serial("id").primaryKey(),
    budgetYear: integer("budget_year").notNull(),
    yearActive: boolean("year_active").default(false).notNull(),
  },
  (t) => [
    uniqueIndex("leave_years_budget_year_idx").on(t.budgetYear),
    index("leave_years_active_idx").on(t.yearActive),
  ],
);

/** legacy: la_permission → leave_permissions */
export const leavePermissions = pgTable("leave_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: integer("p1").default(0).notNull(),
  p2: integer("p2").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
});

/** legacy: la_person_set → leave_person_settings */
export const leavePersonSettings = pgTable(
  "leave_person_settings",
  {
    id: serial("id").primaryKey(),
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
export const leaveCollect = pgTable(
  "leave_collect",
  {
    id: serial("id").primaryKey(),
    budgetYear: integer("budget_year").notNull(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    collectDay: real("collect_day").default(0).notNull(),
    thisYearDay: integer("this_year_day").default(0).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("leave_collect_budget_year_person_id_idx").on(
      t.budgetYear,
      t.personId,
    ),
  ],
);

/** legacy: la_main → leave_requests */
export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: serial("id").primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    schoolId: integer("school_id").references(() => schools.id),
    leaveType: integer("leave_type").notNull(),
    writeAt: varchar("write_at", { length: 100 }),
    because: varchar("because", { length: 250 }),
    leaveStart: date("leave_start").notNull(),
    leaveFinish: date("leave_finish").notNull(),
    halfDayPeriod: varchar("half_day_period", { length: 10 }),
    leaveTotal: real("leave_total").notNull(),
    lastLeaveStart: date("last_leave_start"),
    lastLeaveFinish: date("last_leave_finish"),
    lastLeaveTotal: real("last_leave_total"),
    sickAgo: real("sick_ago"),
    sickThis: real("sick_this"),
    sickTotal: real("sick_total"),
    privacyAgo: real("privacy_ago"),
    privacyThis: real("privacy_this"),
    privacyTotal: real("privacy_total"),
    birthAgo: real("birth_ago"),
    birthThis: real("birth_this"),
    birthTotal: real("birth_total"),
    relaxAgo: real("relax_ago"),
    relaxThis: real("relax_this"),
    relaxTotal: real("relax_total"),
    relaxCollect: real("relax_collect"),
    relaxThisYear: real("relax_this_year"),
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
    commanderGrant: integer("commander_grant"),
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

export const leaveQuotaBalances = pgTable(
  "leave_quota_balances",
  {
    id: serial("id").primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    budgetYear: integer("budget_year").notNull(),
    leaveType: integer("leave_type").notNull(),
    entitled: real("entitled").default(0).notNull(),
    used: real("used").default(0).notNull(),
    carried: real("carried").default(0).notNull(),
  },
  (t) => [
    uniqueIndex("leave_quota_balances_person_year_type_idx").on(
      t.personId,
      t.budgetYear,
      t.leaveType,
    ),
  ],
);

export const leaveRequestFiles = pgTable(
  "leave_request_files",
  {
    id: serial("id").primaryKey(),
    requestId: integer("request_id")
      .notNull()
      .references(() => leaveRequests.id, { onDelete: "cascade" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileDes: varchar("file_des", { length: 255 }),
    fileSize: integer("file_size"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("leave_request_files_request_id_idx").on(t.requestId)],
);

/** legacy: la_cancel → leave_cancellations */
export const leaveCancellations = pgTable(
  "leave_cancellations",
  {
    id: serial("id").primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    sourceRequestId: integer("source_request_id")
      .notNull()
      .references(() => leaveRequests.id, { onDelete: "cascade" }),
    leaveType: integer("leave_type").notNull(),
    writeAt: varchar("write_at", { length: 100 }),
    permissionStart: date("permission_start").notNull(),
    permissionFinish: date("permission_finish").notNull(),
    permissionTotal: real("permission_total").notNull(),
    because: varchar("because", { length: 200 }).notNull(),
    cancelStart: date("cancel_start").notNull(),
    cancelFinish: date("cancel_finish").notNull(),
    cancelTotal: real("cancel_total").notNull(),
    noComment: boolean("no_comment").default(false).notNull(),
    grantPersonSelected: varchar("grant_person_selected", { length: 13 }),
    officerComment: varchar("officer_comment", { length: 200 }),
    officerSignPersonId: varchar("officer_sign_person_id", { length: 13 }),
    officerDate: timestamp("officer_date"),
    groupComment: varchar("group_comment", { length: 100 }),
    groupSignPersonId: varchar("group_sign_person_id", { length: 13 }),
    groupDate: timestamp("group_date"),
    commanderGrant: integer("commander_grant"),
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
export const permissionYears = pgTable(
  "permission_years",
  {
    id: serial("id").primaryKey(),
    budgetYear: integer("budget_year").notNull(),
    yearActive: boolean("year_active").default(false).notNull(),
  },
  (t) => [uniqueIndex("permission_years_budget_year_idx").on(t.budgetYear)],
);

/** legacy: permission_permission */
export const permissionPermissions = pgTable("permission_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: integer("p1").default(0).notNull(),
  p2: integer("p2").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
});

/** legacy: meeting_room */
export const meetingRooms = pgTable(
  "meeting_rooms",
  {
    id: serial("id").primaryKey(),
    roomCode: integer("room_code").notNull(),
    roomName: varchar("room_name", { length: 100 }).notNull(),
    active: boolean("active").default(false).notNull(),
  },
  (t) => [uniqueIndex("meeting_rooms_room_code_idx").on(t.roomCode)],
);

/** legacy: meeting_permission */
export const meetingPermissions = pgTable("meeting_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: integer("p1").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
});

/** legacy: meeting_main */
export const meetingBookings = pgTable(
  "meeting_bookings",
  {
    id: serial("id").primaryKey(),
    roomCode: integer("room_code").notNull(),
    bookDate: date("book_date").notNull(),
    bookDateEnd: date("book_date_end").notNull(),
    startTime: integer("start_time").notNull(),
    finishTime: integer("finish_time").notNull(),
    objective: varchar("objective", { length: 200 }).notNull(),
    personNum: integer("person_num"),
    other: varchar("other", { length: 200 }),
    bookPersonId: varchar("book_person_id", { length: 13 }).notNull(),
    recDate: timestamp("rec_date").defaultNow().notNull(),
    approve: integer("approve"),
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
export const permissionRequests = pgTable(
  "permission_requests",
  {
    id: serial("id").primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    refId: varchar("ref_id", { length: 50 }).notNull(),
    schoolId: integer("school_id").references(() => schools.id),
    subject: varchar("subject", { length: 150 }).notNull(),
    place: varchar("place", { length: 150 }).notNull(),
    travelStart: date("travel_start").notNull(),
    travelFinish: date("travel_finish").notNull(),
    vehicle: varchar("vehicle", { length: 150 }),
    document: varchar("document", { length: 150 }),
    grantStatus: integer("grant_status"),
    grantComment: varchar("grant_comment", { length: 200 }),
    grantPersonId: varchar("grant_person_id", { length: 13 }),
    grantDate: timestamp("grant_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("permission_requests_ref_id_idx").on(t.refId),
    index("permission_requests_person_id_idx").on(t.personId),
    index("permission_requests_school_id_idx").on(t.schoolId),
    index("permission_requests_travel_start_idx").on(t.travelStart),
  ],
);

/** legacy: car_type */
export const carTypes = pgTable(
  "car_types",
  {
    id: serial("id").primaryKey(),
    code: integer("code").notNull(),
    name: varchar("name", { length: 250 }).notNull(),
  },
  (t) => [uniqueIndex("car_types_code_idx").on(t.code)],
);

/** legacy: car_car */
export const carVehicles = pgTable(
  "car_vehicles",
  {
    id: serial("id").primaryKey(),
    carCode: integer("car_code").notNull(),
    carTypeCode: integer("car_type_code").notNull(),
    carNumber: varchar("car_number", { length: 100 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    pic: varchar("pic", { length: 150 }),
    status: integer("status").default(2).notNull(),
  },
  (t) => [uniqueIndex("car_vehicles_car_code_idx").on(t.carCode)],
);

/** legacy: car_driver */
export const carDrivers = pgTable(
  "car_drivers",
  {
    id: serial("id").primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    status: integer("status").default(0).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }),
    recDate: date("rec_date"),
  },
  (t) => [index("car_drivers_person_id_idx").on(t.personId)],
);

/** legacy: car_permission */
export const carPermissions = pgTable("car_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: integer("p1").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
});

/** legacy: affair_main */
export const affairEntries = pgTable(
  "affair_entries",
  {
    id: serial("id").primaryKey(),
    affairDate: date("affair_date").notNull(),
    affairTime: varchar("affair_time", { length: 50 }).notNull(),
    subject: varchar("subject", { length: 150 }).notNull(),
    location: varchar("location", { length: 150 }).notNull(),
    operationPersonId: varchar("operation_person_id", { length: 13 }).notNull(),
    remark: varchar("remark", { length: 150 }),
    recDate: date("rec_date").notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }).notNull(),
  },
  (t) => [
    index("affair_entries_affair_date_idx").on(t.affairDate),
    index("affair_entries_operation_person_id_idx").on(t.operationPersonId),
  ],
);

/** legacy: affair_permission */
export const affairPermissions = pgTable("affair_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: integer("p1").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
  recDate: date("rec_date"),
});

/** legacy: cabinet_main (v1 flat document store) */
export const cabinetDocuments = pgTable(
  "cabinet_documents",
  {
    id: serial("id").primaryKey(),
    fileId: integer("file_id").default(1).notNull(),
    trayId: integer("tray_id").default(1).notNull(),
    cabinetId: integer("cabinet_id").default(1).notNull(),
    cabinetType: integer("cabinet_type").default(1).notNull(),
    docSubject: varchar("doc_subject", { length: 150 }).notNull(),
    docSize: real("doc_size").notNull(),
    docName: varchar("doc_name", { length: 255 }).notNull(),
    docType: varchar("doc_type", { length: 10 }).notNull(),
    status: integer("status").default(0).notNull(),
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
export const cabinetPermissions = pgTable("cabinet_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: integer("p1").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
  recDate: date("rec_date"),
});

/** legacy: news_mainitem */
export const newsMainitems = pgTable(
  "news_mainitems",
  {
    id: serial("id").primaryKey(),
    code: integer("code").notNull(),
    mainitem: varchar("mainitem", { length: 150 }).notNull(),
    itemActive: boolean("item_active").default(false).notNull(),
  },
  (t) => [uniqueIndex("news_mainitems_code_idx").on(t.code)],
);

/** legacy: news_section */
export const newsSections = pgTable(
  "news_sections",
  {
    id: serial("id").primaryKey(),
    code: integer("code").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    mainitemCode: integer("mainitem_code").notNull(),
  },
  (t) => [
    uniqueIndex("news_sections_mainitem_code_idx").on(t.mainitemCode, t.code),
  ],
);

/** legacy: news_news */
export const newsArticles = pgTable(
  "news_articles",
  {
    id: serial("id").primaryKey(),
    reportDate: timestamp("report_date").defaultNow().notNull(),
    news: varchar("news", { length: 250 }).notNull(),
    file: varchar("file", { length: 255 }),
    sectionCode: integer("section_code").notNull(),
    mainitemCode: integer("mainitem_code").notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }).notNull(),
  },
  (t) => [
    index("news_articles_mainitem_code_idx").on(t.mainitemCode),
    index("news_articles_section_code_idx").on(t.sectionCode),
    index("news_articles_report_date_idx").on(t.reportDate),
  ],
);

/** legacy: news_permission */
export const newsPermissions = pgTable("news_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: integer("p1").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
  recDate: date("rec_date"),
});

/** legacy: car_main */
export const carRequests = pgTable(
  "car_requests",
  {
    id: serial("id").primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    recDate: date("rec_date").notNull(),
    carCode: integer("car_code").notNull(),
    place: varchar("place", { length: 200 }).notNull(),
    because: varchar("because", { length: 200 }).notNull(),
    carStart: date("car_start").notNull(),
    timeStart: real("time_start"),
    carFinish: date("car_finish").notNull(),
    timeFinish: real("time_finish"),
    dayTotal: integer("day_total"),
    personNum: integer("person_num"),
    controlPerson: varchar("control_person", { length: 100 }),
    fuel: integer("fuel").notNull(),
    project: varchar("project", { length: 100 }),
    activity: varchar("activity", { length: 100 }),
    money: real("money"),
    selfDriver: integer("self_driver"),
    privateCar: integer("private_car"),
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
    commanderGrant: integer("commander_grant"),
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
export const achievementPermissions = pgTable("achievement_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  p1: integer("p1").default(0).notNull(),
  p2: integer("p2").default(0).notNull(),
  p3: integer("p3").default(0).notNull(),
  officerPersonId: varchar("officer_person_id", { length: 13 }),
});

/** legacy: achievement_main */
export const achievementScores = pgTable(
  "achievement_scores",
  {
    id: serial("id").primaryKey(),
    testType: integer("test_type").notNull(),
    testClass: integer("test_class").notNull(),
    edYear: integer("ed_year").notNull(),
    schoolCode: varchar("school_code", { length: 12 }).notNull(),
    thai: real("thai").default(0).notNull(),
    math: real("math").default(0).notNull(),
    science: real("science").default(0).notNull(),
    social: real("social").default(0).notNull(),
    english: real("english").default(0).notNull(),
    health: real("health").default(0).notNull(),
    art: real("art").default(0).notNull(),
    vocation: real("vocation").default(0).notNull(),
    scoreAvg: real("score_avg").default(0).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }),
    recDate: date("rec_date"),
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
export const studentEdYears = pgTable(
  "student_ed_years",
  {
    id: serial("id").primaryKey(),
    edYear: integer("ed_year").notNull(),
    yearActive: boolean("year_active").default(false).notNull(),
  },
  (t) => [uniqueIndex("student_ed_years_ed_year_idx").on(t.edYear)],
);

/** legacy: student_main_permission */
export const studentPermissions = pgTable(
  "student_permissions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: integer("school_id").references(() => schools.id),
    p1: integer("p1").default(0).notNull(),
    p2: integer("p2").default(0).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }),
  },
  (t) => [
    uniqueIndex("student_permissions_user_school_idx").on(t.userId, t.schoolId),
  ],
);

/** legacy: student_main_main */
export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    edYear: integer("ed_year").notNull(),
    refId: varchar("ref_id", { length: 20 }).notNull(),
    schoolCode: varchar("school_code", { length: 15 }).notNull(),
    studentId: varchar("student_id", { length: 15 }).notNull(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    prename: varchar("prename", { length: 20 }).notNull(),
    name: varchar("name", { length: 50 }).notNull(),
    surname: varchar("surname", { length: 50 }).notNull(),
    sex: varchar("sex", { length: 5 }).notNull(),
    schoolName: varchar("school_name", { length: 150 }).notNull(),
    classLevel: integer("class_level").notNull(),
    classroom: integer("classroom").default(1).notNull(),
    disable: integer("disable").default(0).notNull(),
    status: integer("status").default(0).notNull(),
    recDate: date("rec_date").notNull(),
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
export const spacialStudentPermissions = pgTable(
  "spacial_student_permissions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: integer("school_id").references(() => schools.id),
    p1: integer("p1").default(0).notNull(),
    p2: integer("p2").default(0).notNull(),
    p3: integer("p3").default(0).notNull(),
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
export const spacialStudentDisabled = pgTable(
  "spacial_student_disabled",
  {
    id: serial("id").primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    schoolCode: varchar("school_code", { length: 15 }).notNull(),
    disableType: integer("disable_type").default(0).notNull(),
    disableDetail: text("disable_detail").default("").notNull(),
    other: text("other").default("").notNull(),
    pic: varchar("pic", { length: 150 }).default("").notNull(),
    status: integer("status").default(0).notNull(),
    officerPersonId: varchar("officer_person_id", { length: 13 }).notNull(),
    recDate: date("rec_date").notNull(),
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
export const planYears = pgTable(
  "plan_years",
  {
    id: serial("id").primaryKey(),
    budgetYear: integer("budget_year").notNull(),
    yearActive: boolean("year_active").default(false).notNull(),
  },
  (t) => [uniqueIndex("plan_years_budget_year_idx").on(t.budgetYear)],
);

/** legacy: plan_proj */
export const planProjects = pgTable(
  "plan_projects",
  {
    id: serial("id").primaryKey(),
    budgetYear: integer("budget_year").notNull(),
    codeClus: integer("code_clus").notNull(),
    codeTegy: varchar("code_tegy", { length: 1 }).default("1").notNull(),
    codeProj: varchar("code_proj", { length: 3 }).notNull(),
    budgetProj: real("budget_proj").default(0).notNull(),
    nameProj: varchar("name_proj", { length: 100 }).notNull(),
    ownerProj: varchar("owner_proj", { length: 13 }).default("").notNull(),
    beginDate: date("begin_date").notNull(),
    finishDate: date("finish_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("plan_projects_year_code_idx").on(t.budgetYear, t.codeProj),
    index("plan_projects_budget_year_idx").on(t.budgetYear),
    index("plan_projects_code_clus_idx").on(t.codeClus),
  ],
);

/** legacy: plan_acti */
export const planActivities = pgTable(
  "plan_activities",
  {
    id: serial("id").primaryKey(),
    budgetYear: integer("budget_year").notNull(),
    codeClus: integer("code_clus").notNull(),
    codeProj: varchar("code_proj", { length: 3 }).notNull(),
    codeActi: varchar("code_acti", { length: 6 }).notNull(),
    codeApprove: varchar("code_approve", { length: 6 }).default("").notNull(),
    budgetActi: real("budget_acti").default(0).notNull(),
    nameActi: varchar("name_acti", { length: 100 }).notNull(),
    ownerActi: varchar("owner_acti", { length: 13 }).default("").notNull(),
    beginDate: date("begin_date").notNull(),
    finishDate: date("finish_date").notNull(),
    stop: integer("stop"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("plan_activities_year_code_idx").on(t.budgetYear, t.codeActi),
    index("plan_activities_proj_idx").on(t.budgetYear, t.codeProj),
  ],
);

/** legacy: budget_year */
export const budgetYears = pgTable(
  "budget_years",
  {
    id: serial("id").primaryKey(),
    budgetYear: integer("budget_year").notNull(),
    yearActive: boolean("year_active").default(false).notNull(),
  },
  (t) => [uniqueIndex("budget_years_budget_year_idx").on(t.budgetYear)],
);

/** legacy: budget_permission */
export const budgetPermissions = pgTable(
  "budget_permissions",
  {
    id: serial("id").primaryKey(),
    personId: varchar("person_id", { length: 13 }).notNull(),
    p1: integer("p1").default(0).notNull(),
    p2: integer("p2").default(0).notNull(),
    p3: integer("p3").default(0).notNull(),
    p4: integer("p4").default(0).notNull(),
    p5: integer("p5").default(0).notNull(),
    p6: integer("p6").default(0).notNull(),
    p7: integer("p7").default(0).notNull(),
    p8: integer("p8").default(0).notNull(),
    p9: integer("p9").default(0).notNull(),
    p10: integer("p10").default(0).notNull(),
    officer: varchar("officer", { length: 13 }).notNull(),
    recDate: date("rec_date").notNull(),
  },
  (t) => [uniqueIndex("budget_permissions_person_id_idx").on(t.personId)],
);

/** legacy: budget_pay_type */
export const budgetPayTypes = pgTable("budget_pay_types", {
  id: serial("id").primaryKey(),
  payTypeId: integer("pay_type_id").notNull(),
  payGroupId: integer("pay_group_id").notNull(),
  payTypeName: varchar("pay_type_name", { length: 100 }).notNull(),
});

/** legacy: budget_main — ทะเบียนรับ/จ่ายหลัก */
export const budgetMain = pgTable(
  "budget_main",
  {
    id: serial("id").primaryKey(),
    budgetYear: integer("budget_year").notNull(),
    doc: varchar("doc", { length: 30 }).notNull(),
    referWdId: integer("refer_wd_id"),
    referDeegaId: integer("refer_deega_id"),
    typeId: integer("type_id").notNull(),
    item: varchar("item", { length: 100 }).notNull(),
    receiveAmount: real("receive_amount"),
    payAmount: real("pay_amount"),
    payedPerson: varchar("payed_person", { length: 50 }),
    changeAmount: real("change_amount"),
    payGroup: integer("pay_group"),
    status: integer("status"),
    recDate: date("rec_date").notNull(),
    officer: varchar("officer", { length: 13 }),
    approveDate: date("approve_date"),
    approve: integer("approve"),
    approveName: varchar("approve_name", { length: 13 }),
    payDate: date("pay_date"),
    checkNumber: varchar("check_number", { length: 30 }),
    payee: varchar("payee", { length: 50 }),
    payer: varchar("payer", { length: 13 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("budget_main_budget_year_idx").on(t.budgetYear),
    index("budget_main_type_id_idx").on(t.typeId),
    index("budget_main_rec_date_idx").on(t.recDate),
  ],
);

/** legacy: idocument_main */
export const idocumentMain = pgTable(
  "idocument_main",
  {
    id: serial("id").primaryKey(),
    workgroup: integer("workgroup").notNull(),
    workgroupTxt: text("workgroup_txt").notNull(),
    bookYear: integer("book_year").notNull(),
    bookNumber: integer("book_number").notNull(),
    bookNo: varchar("book_no", { length: 50 }).notNull(),
    bookDate: date("book_date").notNull(),
    subject: text("subject").notNull(),
    preDocId: varchar("pre_doc_id", { length: 100 }).notNull(),
    bookTo: varchar("book_to", { length: 255 }).notNull(),
    content1: text("content1").notNull(),
    content2: text("content2").notNull(),
    content3: text("content3").notNull(),
    officer: varchar("officer", { length: 20 }).notNull(),
    officerName: varchar("officer_name", { length: 255 }).notNull(),
    officerPosition: varchar("officer_position", { length: 255 }).notNull(),
    bookStatus: integer("book_status").notNull(),
    bookType: integer("book_type").notNull(),
  },
  (t) => [
    index("idocument_main_officer_idx").on(t.officer),
    index("idocument_main_book_year_number_idx").on(t.bookYear, t.bookNumber),
    index("idocument_main_book_status_idx").on(t.bookStatus),
  ],
);

/** legacy: idocument_sendto */
export const idocumentSendto = pgTable(
  "idocument_sendto",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id").notNull(),
    recId: varchar("rec_id", { length: 50 }).notNull(),
    recFrom: varchar("rec_from", { length: 25 }),
    personId: varchar("person_id", { length: 20 }).notNull(),
    sendTime: timestamp("send_time").defaultNow().notNull(),
    openTime: timestamp("open_time"),
    documentFrom: varchar("document_from", { length: 50 }),
    status: integer("status"),
  },
  (t) => [
    index("idocument_sendto_person_status_idx").on(t.personId, t.status),
    index("idocument_sendto_document_id_idx").on(t.documentId),
  ],
);

/** legacy: idocument_comment */
export const idocumentComment = pgTable(
  "idocument_comment",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id").notNull(),
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
    commentsType: integer("comments_type"),
    commentsStatus: integer("comments_status"),
  },
  (t) => [index("idocument_comment_document_id_idx").on(t.documentId)],
);

/** legacy: idocument_files */
export const idocumentFiles = pgTable(
  "idocument_files",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id"),
    fileName: varchar("file_name", { length: 255 }),
    fileDes: varchar("file_des", { length: 255 }),
    filetype: varchar("filetype", { length: 5 }),
    docType: varchar("docType", { length: 10 }),
  },
  (t) => [index("idocument_files_document_id_idx").on(t.documentId)],
);
