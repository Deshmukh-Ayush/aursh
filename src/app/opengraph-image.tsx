import React from "react";
import { ImageResponse } from "next/og";
import { OgTemplate } from "@/components/og/og-template";

export const runtime = "nodejs";
export const alt = "Scrunity — B2B Client Workspace & Revenue Protection";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <OgTemplate
        title="The Single Source of Truth for Client Collaboration."
        description="Manage projects, contracts, deliverables, revision limits, and payment milestones in one verified workspace."
        badge="Agency Workspace"
        domain="app.scrunity.com"
      />
    ),
    {
      ...size,
    }
  );
}
