import {z} from "zod";
import {evidenceSchema} from "./evidence.js";
export const componentKinds=["statement","visual","image"] as const;
export type ComponentKind=typeof componentKinds[number];
// Draft coverage is a declaration for presenter review, never independent verification.
const claimReference=z.string().regex(/^(beat|beat:(?:[0-9]|1[01]))$/);
export const componentClaimsSchema=z.object({statement:z.array(claimReference).max(12).optional(),visual:z.array(claimReference).max(12).optional(),image:z.array(claimReference).max(12).optional()});
export const componentEvidenceSchema=z.object({statement:z.object({contentHash:z.string().regex(/^[a-f0-9]{64}$/),evidence:evidenceSchema}).optional(),visual:z.object({contentHash:z.string().regex(/^[a-f0-9]{64}$/),evidence:evidenceSchema}).optional(),image:z.object({contentHash:z.string().regex(/^[a-f0-9]{64}$/),evidence:evidenceSchema}).optional()});
