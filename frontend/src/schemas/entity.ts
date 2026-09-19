import { z } from "zod";

export const attributeRowSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string(),
});

export const entitySchema = z.object({
  device_id: z.string().min(1, "Device ID is required").max(100, "Device ID must be at most 100 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  type: z.enum(["vehicle", "iot", "facility", "other"], { error: "Type must be one of: vehicle, iot, facility, other" }),
  status: z.enum(["active", "inactive", "maintenance"], { error: "Status must be one of: active, inactive, maintenance" }),
  description: z.string().max(500, "Description must be at most 500 characters").optional().or(z.literal("")),
  lat: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  lng: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  attributes: z.array(attributeRowSchema),
});

export type AttributeRow = z.infer<typeof attributeRowSchema>;
export type EntityFormValues = z.infer<typeof entitySchema>;
