import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { entitySchema, type EntityFormValues } from "./schema";
import { useCreateEntity, useUpdateEntity } from "./hooks";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Entity } from "@/interface/entity.interface";

interface EntityFormProps {
  entity?: Entity | null; // present when editing
  onDone: () => void;
}

export function EntityForm({ entity, onDone }: EntityFormProps) {
  const createMut = useCreateEntity();
  const updateMut = useUpdateEntity();
  const draftLatLng = useUIStore((s) => s.draftLatLng);
  const isEdit = !!entity;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EntityFormValues>({
    resolver: zodResolver(entitySchema),
    defaultValues: entity
      ? {
          device_id: entity.device_id,
          name: entity.name,
          type: entity.type,
          status: entity.status,
          description: entity.description ?? "",
          lat: entity.lat,
          lng: entity.lng,
        }
      : {
          device_id: "",
          name: "",
          type: "vehicle",
          status: "active",
          description: "",
          lat: draftLatLng?.lat ?? 0,
          lng: draftLatLng?.lng ?? 0,
        },
  });

  // Update lat/lng when draft changes (pick mode, both add and edit)
  useEffect(() => {
    if (draftLatLng) {
      setValue("lat", draftLatLng.lat);
      setValue("lng", draftLatLng.lng);
    }
  }, [draftLatLng, setValue]);

  const lat = watch("lat");
  const lng = watch("lng");
  const type = watch("type");
  const status = watch("status");

  const onSubmit = async (values: EntityFormValues) => {
    try {
      if (isEdit && entity) {
        await updateMut.mutateAsync({ id: entity.id, input: values });
      } else {
        await createMut.mutateAsync(values);
      }
      onDone();
    } catch {
      // errors surfaced via toast in hooks
    }
  };

  // Merge RHF field errors with any backend field errors into resolved messages
  const backendErrors: Record<string, string | undefined> = {
    ...(createMut.error as { errors?: Record<string, string> })?.errors,
    ...(updateMut.error as { errors?: Record<string, string> })?.errors,
  };
  const fieldErrors = {
    device_id: errors.device_id?.message ?? backendErrors.device_id,
    name: errors.name?.message ?? backendErrors.name,
    type: errors.type?.message ?? backendErrors.type,
    status: errors.status?.message ?? backendErrors.status,
    description: errors.description?.message ?? backendErrors.description,
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="device_id">Device ID</Label>
        <Input id="device_id" {...register("device_id")} />
        {fieldErrors.device_id && (
          <p className="text-sm text-destructive">{fieldErrors.device_id}</p>
        )}
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {fieldErrors.name && (
          <p className="text-sm text-destructive">{fieldErrors.name}</p>
        )}
      </div>

      <div>
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setValue("type", v as EntityFormValues["type"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="vehicle">Vehicle</SelectItem>
            <SelectItem value="iot">IoT</SelectItem>
            <SelectItem value="facility">Facility</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {fieldErrors.type && <p className="text-sm text-destructive">{fieldErrors.type}</p>}
      </div>

      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setValue("status", v as EntityFormValues["status"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        {fieldErrors.status && <p className="text-sm text-destructive">{fieldErrors.status}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" {...register("description")} />
        {fieldErrors.description && <p className="text-sm text-destructive">{fieldErrors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Latitude</Label>
          <Input type="number" step="any" value={lat} readOnly className="bg-muted" />
        </div>
        <div>
          <Label>Longitude</Label>
          <Input type="number" step="any" value={lng} readOnly className="bg-muted" />
        </div>
      </div>

      {isEdit && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            useUIStore.getState().setPickMode(true);
            useUIStore.getState().setActiveOverlay("edit");
          }}
        >
          Re-pick Location
        </Button>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : isEdit ? "Update Entity" : "Create Entity"}
      </Button>
    </form>
  );
}
