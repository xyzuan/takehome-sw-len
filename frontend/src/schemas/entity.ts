import { z } from "zod";

export const entitySchema = z.object({
  device_id: z.string().min(1, "device_id is required").max(100, "device_id must be at most 100 characters"),
  name: z.string().min(1, "name is required").max(100, "name must be at most 100 characters"),
  type: z.enum(["vehicle", "iot", "facility", "other"], { error: "type must be one of: vehicle, iot, facility, other" }),
  status: z.enum(["active", "inactive", "maintenance"], { error: "status must be one of: active, inactive, maintenance" }),
  description: z.string().max(500, "description must be at most 500 characters").optional().or(z.literal("")),
  lat: z.number().min(-90, "lat must be between -90 and 90").max(90, "lat must be between -90 and 90"),
  lng: z.number().min(-180, "lng must be between -180 and 180").max(180, "lng must be between -180 and 180"),
});

export type EntityFormValues = z.infer<typeof entitySchema>;
