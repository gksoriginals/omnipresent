import {z} from "zod";
export const evidenceSchema=z.object({
 version:z.literal(1),approved:z.boolean(),provenance:z.enum(["source-backed","illustrative","unknown"]),verification:z.enum(["audited","not-audited","unknown"]),
 entity:z.string().min(1),timeframe:z.string().nullable(),unit:z.string().nullable(),
 sources:z.array(z.object({id:z.string().min(1),uri:z.string().min(1),sha256:z.string().regex(/^[a-f0-9]{64}$/),summary:z.string().min(1)})),
 claims:z.array(z.object({id:z.string().min(1),aliases:z.array(z.string().min(1)).min(1),sourceIds:z.array(z.string()).min(1)})).min(1),
 independentReview:z.enum(["pending","accepted","rejected"]),
});
export type EvidenceContract=z.infer<typeof evidenceSchema>;
