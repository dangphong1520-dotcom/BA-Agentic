"use server";
import { redirect } from "next/navigation";
import { designArtifactSchema, entityIdSchema } from "@ba/contracts";
import { apiRequest } from "@/lib/api";
const field = (form: FormData, name: string) => { const value = form.get(name); if (typeof value !== "string") throw new Error("Invalid action"); return value; };
const scope = (form: FormData) => ({ workspace: entityIdSchema.parse(field(form, "workspace")), project: entityIdSchema.parse(field(form, "project")), requirement: entityIdSchema.parse(field(form, "requirement")) });
const href = (s: ReturnType<typeof scope>) => `/design-studio?workspace=${s.workspace}&project=${s.project}&requirement=${s.requirement}`;
export async function generateDesign(form: FormData) { const s = scope(form); const instruction = String(form.get("instruction") ?? ""); await apiRequest(`/workspaces/${s.workspace}/projects/${s.project}/requirements/${s.requirement}/design/artifacts`, designArtifactSchema, { method: "POST", body: { instruction } }); redirect(`${href(s)}&generated=1`); }
async function review(form: FormData, decision: "accept" | "reject") { const s = scope(form); const artifact = entityIdSchema.parse(field(form, "artifact")); const expectedRevision = Number(field(form, "revision")); await apiRequest(`/workspaces/${s.workspace}/projects/${s.project}/requirements/${s.requirement}/design/artifacts/${artifact}/${decision}`, designArtifactSchema, { method: "POST", body: { expectedRevision } }); redirect(`${href(s)}&reviewed=1`); }
export async function acceptDesign(form: FormData) { return review(form, "accept"); }
export async function rejectDesign(form: FormData) { return review(form, "reject"); }
