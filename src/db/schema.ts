import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, integer, index, jsonb } from "drizzle-orm/pg-core";

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
  logoUrl: text("logo_url"),
  plan: text("plan").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
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
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationInvitation = pgTable("organization_invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("pending"),
  invitedBy: text("invited_by")
    .notNull()
    .references(() => user.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const team = pgTable("team", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const teamMember = pgTable("team_member", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  memberId: text("member_id")
    .notNull()
    .references(() => member.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationRelations = relations(
  organization,
  ({ one, many }) => ({
    creator: one(user, {
      fields: [organization.createdBy],
      references: [user.id],
    }),
    members: many(member),
    invitations: many(organizationInvitation),
    teams: many(team),
    projects: many(project),
  })
);

export const memberRelations = relations(member, ({ one, many }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
  teamMemberships: many(teamMember),
}));

export const organizationInvitationRelations = relations(
  organizationInvitation,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationInvitation.organizationId],
      references: [organization.id],
    }),
    inviter: one(user, {
      fields: [organizationInvitation.invitedBy],
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

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  member: one(member, {
    fields: [teamMember.memberId],
    references: [member.id],
  }),
}));

export const project = pgTable("project", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

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
});

export const projectInvitation = pgTable("project_invitation", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("pending"),
  invitedBy: text("invited_by")
    .notNull()
    .references(() => user.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  paymentMilestones: many(paymentMilestone),
  payments: many(payment),
  proposals: many(proposal),
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
  status: text("status").notNull().default("draft"),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const signature = pgTable("signature", {
  id: text("id").primaryKey(),
  contractId: text("contract_id")
    .notNull()
    .references(() => contract.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  signatureData: text("signature_data").notNull(),
  signatureMethod: text("signature_method").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  documentHash: text("document_hash"),
  auditTrail: jsonb("audit_trail"),
  signedAt: timestamp("signed_at").defaultNow().notNull(),
});

export const file = pgTable("file", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(),
  uploadedBy: text("uploaded_by").references(() => user.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliverable = pgTable("deliverable", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["pending", "in_review", "approved", "revision_requested"] }).default("pending").notNull(),
  dueDate: timestamp("due_date"),
  createdBy: text("created_by").references(() => user.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activityTypes = [
  "contract_uploaded", "contract_signed", "file_uploaded", 
  "deliverable_created", "deliverable_approved", "revision_requested", 
  "deliverable_completed", "project_completed", "member_joined",
  "deliverable_in_review", "comment_added",
  "proposal_sent", "proposal_accepted", "proposal_declined",
  "payment_requested", "payment_completed", "payment_overdue", "milestone_created"
] as const;

export const activityLog = pgTable("activity_log", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => user.id), // The actor
  type: text("type", { enum: activityTypes }).notNull(),
  metadata: jsonb("metadata"), // Flexible JSON for things like filenames, deliverable titles, revision comments
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comment = pgTable("comment", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }).notNull(),
  deliverableId: text("deliverable_id").references(() => deliverable.id, { onDelete: "cascade" }), // nullable
  userId: text("user_id").references(() => user.id).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentRelations = relations(comment, ({ one }) => ({
  project: one(project, { fields: [comment.projectId], references: [project.id] }),
  deliverable: one(deliverable, { fields: [comment.deliverableId], references: [deliverable.id] }),
  user: one(user, { fields: [comment.userId], references: [user.id] }),
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
  index("pm_project_idx").on(table.projectId),
  index("pm_proposal_idx").on(table.proposalId),
  index("pm_deliverable_idx").on(table.deliverableId),
]);

export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  milestoneId: text("milestone_id").notNull().references(() => paymentMilestone.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: text("currency").default("INR").notNull(),
  paymentMethod: text("payment_method").default("upi"), // upi, bank_transfer, card, cash, manual
  referenceNote: text("reference_note"), // UTR, transaction hash, bank ref, or note
  dodoPaymentId: text("dodo_payment_id"), // optional for future gateway webhooks
  dodoCheckoutId: text("dodo_checkout_id"), // optional for future gateway webhooks
  status: text("status", { enum: ["pending", "succeeded", "failed"] }).notNull().default("succeeded"),
  paidAt: timestamp("paid_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("pay_milestone_idx").on(table.milestoneId),
  index("pay_project_idx").on(table.projectId),
]);

export const paymentMilestoneRelations = relations(paymentMilestone, ({ one, many }) => ({
  project: one(project, { fields: [paymentMilestone.projectId], references: [project.id] }),
  deliverable: one(deliverable, { fields: [paymentMilestone.deliverableId], references: [deliverable.id] }),
  payments: many(payment),
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  milestone: one(paymentMilestone, { fields: [payment.milestoneId], references: [paymentMilestone.id] }),
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
