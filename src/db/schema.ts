import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, integer, index, jsonb, uniqueIndex, numeric } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),

  plan: text("plan", { enum: ["free", "freelancer", "agency", "enterprise"] }).default("free").notNull(),
  globalCurrency: text("global_currency", { enum: ["USD", "INR"] }).default("USD").notNull(),
  logoUrl: text("logo_url"),

  // Billing & Subscription Fields
  dodoCustomerId: text("dodo_customer_id"),
  dodoSubscriptionId: text("dodo_subscription_id"),
  subscriptionStatus: text("subscription_status"), // e.g., 'active', 'canceled', 'past_due', 'trialing'
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodEnd: timestamp("current_period_end"),

  metadata: text("metadata"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const member = pgTable("member", {
  id: text("id").primaryKey(),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, {
      onDelete: "cascade",
    }),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade",
    }),

  role: text("role").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("member_org_idx").on(table.organizationId),
  index("member_user_idx").on(table.userId),
]);

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),

  email: text("email").notNull(),

  inviterId: text("inviter_id")
    .references(() => user.id, { onDelete: "set null" }),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, {
      onDelete: "cascade",
    }),

  role: text("role").notNull(),

  status: text("status", { enum: ["pending", "accepted", "declined", "expired"] }).default("pending").notNull(),

  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("invitation_org_idx").on(table.organizationId),
  index("invitation_inviter_idx").on(table.inviterId),
]);

export const team = pgTable("team", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, {
      onDelete: "cascade",
    }),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("team_org_idx").on(table.organizationId),
]);

export const teamMember = pgTable("team_member", {
  id: text("id").primaryKey(),

  teamId: text("team_id")
    .notNull()
    .references(() => team.id, {
      onDelete: "cascade",
    }),

  memberId: text("member_id")
    .notNull()
    .references(() => member.id, {
      onDelete: "cascade",
    }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("tm_team_idx").on(table.teamId),
  index("tm_member_idx").on(table.memberId),
]);

export const organizationRelations = relations(
  organization,
  ({ one, many }) => ({
    members: many(member),
    invitations: many(invitation),
    teams: many(team),
    projects: many(project),
    invoices: many(invoice),
    invoiceDefaults: one(invoiceDefaults),
  })
);

export const memberRelations = relations(member, ({ one, many }) => ({
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),

  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),

  teamMemberships: many(teamMember),
}));

export const invitationRelations = relations(
  invitation,
  ({ one }) => ({
    organization: one(organization, {
      fields: [invitation.organizationId],
      references: [organization.id],
    }),

    inviter: one(user, {
      fields: [invitation.inviterId],
      references: [user.id],
    }),
  })
);

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),

  members: many(teamMember),
}));

export const teamMemberRelations = relations(
  teamMember,
  ({ one }) => ({
    team: one(team, {
      fields: [teamMember.teamId],
      references: [team.id],
    }),

    member: one(member, {
      fields: [teamMember.memberId],
      references: [member.id],
    }),
  })
);

export const project = pgTable("project", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["active", "completed", "archived"] }).notNull().default("active"),
  currency: text("currency", { enum: ["USD", "INR"] }).notNull().default("USD"),
  createdBy: text("created_by")
    .references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("project_org_idx").on(table.organizationId),
  index("project_creator_idx").on(table.createdBy),
]);

export const projectMember = pgTable("project_member", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("pm_project_idx").on(table.projectId),
  index("pm_user_idx").on(table.userId),
  uniqueIndex("pm_project_user_unique").on(table.projectId, table.userId),
]);

export const projectInvitation = pgTable("project_invitation", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  role: text("role").notNull().default("client"),
  status: text("status", { enum: ["pending", "accepted", "declined", "expired"] }).notNull().default("pending"),
  invitedBy: text("invited_by")
    .references(() => user.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("proj_invitation_project_idx").on(table.projectId),
  index("proj_invitation_inviter_idx").on(table.invitedBy),
]);

export const projectRelations = relations(project, ({ one, many }) => ({
  organization: one(organization, {
    fields: [project.organizationId],
    references: [organization.id],
  }),
  creator: one(user, {
    fields: [project.createdBy],
    references: [user.id],
  }),
  members: many(projectMember),
  invitations: many(projectInvitation),
  contracts: many(contract),
  deliverables: many(deliverable),
  activityLogs: many(activityLog),
  files: many(files),
  paymentMilestones: many(paymentMilestone),
  payments: many(payment),
  proposals: many(proposal),
  invoices: many(invoice),
}));

export const projectMemberRelations = relations(projectMember, ({ one }) => ({
  project: one(project, {
    fields: [projectMember.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectMember.userId],
    references: [user.id],
  }),
}));

export const projectInvitationRelations = relations(projectInvitation, ({ one }) => ({
  project: one(project, {
    fields: [projectInvitation.projectId],
    references: [project.id],
  }),
  inviter: one(user, {
    fields: [projectInvitation.invitedBy],
    references: [user.id],
  }),
}));

export const contract = pgTable("contract", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  documentType: text("document_type", { enum: ["sow", "nda", "noc", "msa", "addendum", "other"] }).default("sow").notNull(),
  uploadedByRole: text("uploaded_by_role", { enum: ["agency", "client"] }).default("agency").notNull(),
  status: text("status", { enum: ["draft", "sent", "partially_signed", "fully_signed", "pending_signature", "signed"] }).default("draft").notNull(),
  signedDocumentUrl: text("signed_document_url"),
  documentHash: text("document_hash"),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("contract_project_idx").on(table.projectId),
  index("contract_uploader_idx").on(table.uploadedBy)
]);

export const signature = pgTable("signature", {
  id: text("id").primaryKey(),
  contractId: text("contract_id")
    .notNull()
    .references(() => contract.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "set null" }),
  signedAt: timestamp("signed_at"),
  signatureData: text("signature_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  documentHash: text("document_hash"),
  signatureMethod: text("signature_method"),
  auditTrail: jsonb("audit_trail"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("signature_contract_idx").on(table.contractId),
  index("signature_user_idx").on(table.userId),
  uniqueIndex("signature_contract_user_unique").on(table.contractId, table.userId),
]);

export const files = pgTable("files", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }).notNull(),
  uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("files_project_idx").on(table.projectId),
  index("files_uploader_idx").on(table.uploadedBy)
]);

export const deliverable = pgTable("deliverable", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["pending", "in_review", "approved", "revision_requested"] }).default("pending").notNull(),
  submissionTitle: text("submission_title"),
  submissionUrl: text("submission_url"),
  submissionNote: text("submission_note"),
  dueDate: timestamp("due_date"),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("deliv_project_idx").on(table.projectId),
  index("deliv_creator_idx").on(table.createdBy)
]);

export const activityTypes = [
  "contract_uploaded", "contract_signed", "file_uploaded", 
  "deliverable_created", "deliverable_approved", "revision_requested", 
  "deliverable_completed", "project_completed", "member_joined",
  "deliverable_in_review", "deliverable_reconciled", "comment_added",
  "proposal_sent", "proposal_accepted", "proposal_declined",
  "payment_requested", "payment_completed", "payment_overdue", "milestone_created",
  "invoice_sent", "invoice_paid", "invoice_viewed"
] as const;

export const activityLog = pgTable("activity_log", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  type: text("type", { enum: activityTypes }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("activity_project_idx").on(table.projectId),
  index("activity_user_idx").on(table.userId)
]);

export const notification = pgTable("notification", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }).notNull(),
  type: text("type", { enum: activityTypes }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("notif_user_idx").on(table.userId),
  index("notif_project_idx").on(table.projectId)
]);

export const comment = pgTable("comment", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }).notNull(),
  deliverableId: text("deliverable_id").references(() => deliverable.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("comment_project_idx").on(table.projectId),
  index("comment_deliv_idx").on(table.deliverableId),
  index("comment_user_idx").on(table.userId)
]);

export const commentRelations = relations(comment, ({ one }) => ({
  project: one(project, { fields: [comment.projectId], references: [project.id] }),
  deliverable: one(deliverable, { fields: [comment.deliverableId], references: [deliverable.id] }),
  user: one(user, { fields: [comment.userId], references: [user.id] }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
  project: one(project, { fields: [notification.projectId], references: [project.id] }),
}));

export const contractScopeTerm = pgTable("contract_scope_term", {
  id: text("id").primaryKey(),
  contractId: text("contract_id")
    .notNull()
    .references(() => contract.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  termType: text("term_type", {
    enum: ["scope", "exclusion", "revision_limit", "payment_term"],
  }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  maxRevisions: integer("max_revisions"),
  extractedAt: timestamp("extracted_at").defaultNow().notNull(),
}, (table) => [
  index("cst_contract_idx").on(table.contractId),
  index("cst_project_idx").on(table.projectId),
]);

export const contractScopeTermRelations = relations(contractScopeTerm, ({ one }) => ({
  contract: one(contract, {
    fields: [contractScopeTerm.contractId],
    references: [contract.id],
  }),
  project: one(project, {
    fields: [contractScopeTerm.projectId],
    references: [project.id],
  }),
}));

export const contractRelations = relations(contract, ({ one, many }) => ({
  project: one(project, {
    fields: [contract.projectId],
    references: [project.id],
  }),
  uploader: one(user, {
    fields: [contract.uploadedBy],
    references: [user.id],
  }),
  signatures: many(signature),
  scopeTerms: many(contractScopeTerm),
}));

export const signatureRelations = relations(signature, ({ one }) => ({
  contract: one(contract, {
    fields: [signature.contractId],
    references: [contract.id],
  }),
  user: one(user, {
    fields: [signature.userId],
    references: [user.id],
  }),
}));

export const deliverableRelations = relations(deliverable, ({ one, many }) => ({
  project: one(project, {
    fields: [deliverable.projectId],
    references: [project.id],
  }),
  creator: one(user, {
    fields: [deliverable.createdBy],
    references: [user.id],
  }),
  comments: many(comment),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  project: one(project, {
    fields: [activityLog.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [activityLog.userId],
    references: [user.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  project: one(project, {
    fields: [files.projectId],
    references: [project.id],
  }),
  uploader: one(user, {
    fields: [files.uploadedBy],
    references: [user.id],
  }),
}));

export const paymentMilestone = pgTable("payment_milestone", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  proposalId: text("proposal_id"),
  deliverableId: text("deliverable_id").references(() => deliverable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(),
  currency: text("currency").default("INR").notNull(),
  triggerType: text("trigger_type", { enum: ["upfront", "on_approval", "on_date", "manual"] }).notNull().default("manual"),
  dueDate: timestamp("due_date"),
  status: text("status", { enum: ["upcoming", "due", "overdue", "paid", "waived"] }).notNull().default("upcoming"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("pay_milestone_project_idx").on(table.projectId),
  index("pay_milestone_proposal_idx").on(table.proposalId),
  index("pay_milestone_deliv_idx").on(table.deliverableId),
]);

export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  milestoneId: text("milestone_id").references(() => paymentMilestone.id, { onDelete: "cascade" }),
  invoiceId: text("invoice_id").references(() => invoice.id, { onDelete: "set null" }),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: text("currency").default("INR").notNull(),
  paymentMethod: text("payment_method").default("upi"),
  referenceNote: text("reference_note"),
  fxRateAtPayment: numeric("fx_rate_at_payment", { precision: 10, scale: 4 }),
  dodoPaymentId: text("dodo_payment_id"),
  dodoCheckoutId: text("dodo_checkout_id"),
  status: text("status", { enum: ["pending", "succeeded", "failed"] }).notNull().default("succeeded"),
  paidAt: timestamp("paid_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("pay_milestone_idx").on(table.milestoneId),
  index("pay_invoice_idx").on(table.invoiceId),
  index("pay_project_idx").on(table.projectId),
]);

export const paymentMilestoneRelations = relations(paymentMilestone, ({ one, many }) => ({
  project: one(project, { fields: [paymentMilestone.projectId], references: [project.id] }),
  deliverable: one(deliverable, { fields: [paymentMilestone.deliverableId], references: [deliverable.id] }),
  payments: many(payment),
  invoices: many(invoice),
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  milestone: one(paymentMilestone, { fields: [payment.milestoneId], references: [paymentMilestone.id] }),
  invoice: one(invoice, { fields: [payment.invoiceId], references: [invoice.id] }),
  project: one(project, { fields: [payment.projectId], references: [project.id] }),
}));

export const proposal = pgTable("proposal", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  scopeSummary: text("scope_summary"),
  price: integer("price").notNull(),
  currency: text("currency").default("INR").notNull(),
  validUntil: timestamp("valid_until"),
  status: text("status", { enum: ["draft", "sent", "accepted", "declined"] }).default("draft").notNull(),
  sentAt: timestamp("sent_at"),
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),
  createdBy: text("created_by")
    .references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("proposal_project_idx").on(table.projectId),
  index("proposal_creator_idx").on(table.createdBy),
]);

export const proposalLineItems = pgTable("proposal_line_items", {
  id: text("id").primaryKey(),
  proposalId: text("proposal_id")
    .notNull()
    .references(() => proposal.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  total: integer("total").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("proposal_items_proposal_idx").on(table.proposalId),
]);

export const proposalRelations = relations(proposal, ({ one, many }) => ({
  project: one(project, {
    fields: [proposal.projectId],
    references: [project.id],
  }),
  creator: one(user, {
    fields: [proposal.createdBy],
    references: [user.id],
  }),
  lineItems: many(proposalLineItems),
}));

export const proposalLineItemsRelations = relations(proposalLineItems, ({ one }) => ({
  proposal: one(proposal, {
    fields: [proposalLineItems.proposalId],
    references: [proposal.id],
  }),
}));

export const invoice = pgTable("invoice", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  milestoneId: text("milestone_id")
    .references(() => paymentMilestone.id, { onDelete: "set null" }),
  invoiceNumber: text("invoice_number").notNull(),
  prefix: text("prefix").notNull().default("INV-"),
  serialNumber: integer("serial_number").notNull(),
  currency: text("currency", { enum: ["USD", "INR"] }).notNull().default("INR"),
  themeColor: text("theme_color").notNull().default("#00AAF7"),
  invoiceDate: timestamp("invoice_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  paymentTerms: text("payment_terms"),
  companySnapshot: jsonb("company_snapshot").notNull(),
  clientSnapshot: jsonb("client_snapshot").notNull(),
  billingDetails: jsonb("billing_details").$type<Array<{ id: string; label: string; type: "fixed" | "percentage"; value: number }>>().default([]).notNull(),
  notes: text("notes"),
  additionalTerms: text("additional_terms"),
  paymentInformation: jsonb("payment_information").$type<Array<{ id: string; label: string; value: string }>>().default([]).notNull(),
  subtotal: integer("subtotal").notNull().default(0),
  total: integer("total").notNull().default(0),
  status: text("status", { enum: ["draft", "sent", "viewed", "payment_submitted", "paid", "overdue", "void"] }).notNull().default("draft"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  paidAt: timestamp("paid_at"),
  pdfUrl: text("pdf_url"),
  createdBy: text("created_by")
    .references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("invoice_project_idx").on(table.projectId),
  index("invoice_org_idx").on(table.organizationId),
  index("invoice_milestone_idx").on(table.milestoneId),
  uniqueIndex("invoice_org_number_unique").on(table.organizationId, table.invoiceNumber),
]);

export const invoiceLineItem = pgTable("invoice_line_item", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoice.id, { onDelete: "cascade" }),
  itemName: text("item_name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  lineTotal: integer("line_total").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("invoice_item_invoice_idx").on(table.invoiceId),
]);

export const invoiceDefaults = pgTable("invoice_defaults", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  defaultPrefix: text("default_prefix").notNull().default("INV-"),
  nextSerial: integer("next_serial").notNull().default(1),
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  companyEmail: text("company_email"),
  companyPhone: text("company_phone"),
  logoUrl: text("logo_url"),
  signatureUrl: text("signature_url"),
  defaultPaymentInfo: jsonb("default_payment_info").$type<Array<{ id: string; label: string; value: string }>>(),
  defaultNotes: text("default_notes"),
  defaultTerms: text("default_terms"),
  defaultCustomFields: jsonb("default_custom_fields").$type<Array<{ id: string; label: string; value: string }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  uniqueIndex("invoice_defaults_org_unique").on(table.organizationId),
]);

export const invoiceRelations = relations(invoice, ({ one, many }) => ({
  project: one(project, { fields: [invoice.projectId], references: [project.id] }),
  organization: one(organization, { fields: [invoice.organizationId], references: [organization.id] }),
  milestone: one(paymentMilestone, { fields: [invoice.milestoneId], references: [paymentMilestone.id] }),
  creator: one(user, { fields: [invoice.createdBy], references: [user.id] }),
  lineItems: many(invoiceLineItem),
  payments: many(payment),
  paymentProofs: many(paymentProof),
}));

export const invoiceLineItemRelations = relations(invoiceLineItem, ({ one }) => ({
  invoice: one(invoice, { fields: [invoiceLineItem.invoiceId], references: [invoice.id] }),
}));

export const invoiceDefaultsRelations = relations(invoiceDefaults, ({ one }) => ({
  organization: one(organization, { fields: [invoiceDefaults.organizationId], references: [organization.id] }),
}));

export const organizationCreditPeriod = pgTable("organization_credit_period", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  aiCreditsAllotted: integer("ai_credits_allotted").notNull().default(0),
  aiCreditsUsed: integer("ai_credits_used").notNull().default(0),
  searchCreditsAllotted: integer("search_credits_allotted").notNull().default(0),
  searchCreditsUsed: integer("search_credits_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("org_credit_period_org_idx").on(table.organizationId),
  index("org_credit_period_dates_idx").on(table.periodStart, table.periodEnd),
]);

export const usageEvent = pgTable("usage_event", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "set null" }),
  type: text("type", { enum: ["ai_tool_call", "web_search"] }).notNull(),
  toolName: text("tool_name").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("usage_event_org_idx").on(table.organizationId),
  index("usage_event_created_idx").on(table.createdAt),
]);

export const organizationCreditPeriodRelations = relations(organizationCreditPeriod, ({ one }) => ({
  organization: one(organization, { fields: [organizationCreditPeriod.organizationId], references: [organization.id] }),
}));

export const usageEventRelations = relations(usageEvent, ({ one }) => ({
  organization: one(organization, { fields: [usageEvent.organizationId], references: [organization.id] }),
  user: one(user, { fields: [usageEvent.userId], references: [user.id] }),
}));

export const torchConversation = pgTable("torch_conversation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("torch_conv_org_idx").on(table.organizationId),
  index("torch_conv_user_idx").on(table.userId),
  index("torch_conv_updated_idx").on(table.updatedAt),
]);

export const torchMessage = pgTable("torch_message", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => torchConversation.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  reasoningSteps: jsonb("reasoning_steps"),
  artifact: jsonb("artifact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("torch_msg_conv_idx").on(table.conversationId),
  index("torch_msg_created_idx").on(table.createdAt),
]);

export const torchConversationRelations = relations(torchConversation, ({ one, many }) => ({
  organization: one(organization, { fields: [torchConversation.organizationId], references: [organization.id] }),
  user: one(user, { fields: [torchConversation.userId], references: [user.id] }),
  messages: many(torchMessage),
}));

export const torchMessageRelations = relations(torchMessage, ({ one }) => ({
  conversation: one(torchConversation, { fields: [torchMessage.conversationId], references: [torchConversation.id] }),
}));

export const paymentProof = pgTable("payment_proof", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id")
    .references(() => invoice.id, { onDelete: "cascade" }),
  milestoneId: text("milestone_id")
    .references(() => paymentMilestone.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  extractedData: jsonb("extracted_data"),
  status: text("status", { enum: ["pending_review", "confirmed", "rejected"] }).notNull().default("pending_review"),
  rejectionReason: text("rejection_reason"),
  submittedBy: text("submitted_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reviewedBy: text("reviewed_by")
    .references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
}, (table) => [
  index("payment_proof_invoice_idx").on(table.invoiceId),
  index("payment_proof_milestone_idx").on(table.milestoneId),
  index("payment_proof_status_idx").on(table.status),
  index("payment_proof_project_idx").on(table.projectId),
]);

export const paymentProofRelations = relations(paymentProof, ({ one }) => ({
  invoice: one(invoice, { fields: [paymentProof.invoiceId], references: [invoice.id] }),
  milestone: one(paymentMilestone, { fields: [paymentProof.milestoneId], references: [paymentMilestone.id] }),
  project: one(project, { fields: [paymentProof.projectId], references: [project.id] }),
  submittedByUser: one(user, { fields: [paymentProof.submittedBy], references: [user.id] }),
  reviewedByUser: one(user, { fields: [paymentProof.reviewedBy], references: [user.id] }),
}));



