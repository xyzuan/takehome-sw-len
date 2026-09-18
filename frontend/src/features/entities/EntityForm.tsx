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
  entity?: Entity | null;
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
  const name = watch("name");
  const device_id = watch("device_id");
  const description = watch("description");

  // Sync draft entity for live marker updates during edit
  useEffect(() => {
    if (isEdit && entity) {
      useUIStore.getState().setDraftEntity({
        ...entity,
        device_id,
        name,
        type,
        status,
        description: description || null,
        lat,
        lng,
      });
    }
  }, [isEdit, entity, device_id, name, type, status, description, lat, lng]);

  const onSubmit = async (values: EntityFormValues) => {
    try {
      if (isEdit && entity) {
        await updateMut.mutateAsync({ id: entity.id, input: values });
        useUIStore.getState().setDraftEntity(null);
        useUIStore.getState().setCommittedPos({ lat: values.lat, lng: values.lng });
        useUIStore.getState().setPendingFlyTo({ lat: values.lat, lng: values.lng });
      } else {
        await createMut.mutateAsync(values);
      }
      onDone();
    } catch {
    }
  };

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Row 1: Device ID | Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="device_id" className="text-xs">Device ID</Label>
          <Input id="device_id" {...register("device_id")} className="h-8 text-sm" />
          {fieldErrors.device_id && <p className="text-xs text-destructive mt-0.5">{fieldErrors.device_id}</p>}
        </div>
        <div>
          <Label htmlFor="name" className="text-xs">Name</Label>
          <Input id="name" {...register("name")} className="h-8 text-sm" />
          {fieldErrors.name && <p className="text-xs text-destructive mt-0.5">{fieldErrors.name}</p>}
        </div>
      </div>

      {/* Row 2: Type | Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => setValue("type", v as EntityFormValues["type"])}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="iot">IoT</SelectItem>
              <SelectItem value="facility">Facility</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.type && <p className="text-xs text-destructive mt-0.5">{fieldErrors.type}</p>}
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={(v) => setValue("status", v as EntityFormValues["status"])}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.status && <p className="text-xs text-destructive mt-0.5">{fieldErrors.status}</p>}
        </div>
      </div>

      {/* Row 3: Description */}
      <div>
        <Label htmlFor="description" className="text-xs">Description</Label>
        <Input id="description" {...register("description")} className="h-8 text-sm" />
        {fieldErrors.description && <p className="text-xs text-destructive mt-0.5">{fieldErrors.description}</p>}
      </div>

      {/* Row 4: Long | Lat | Repick (or just Long | Lat for add) */}
      <div className={isEdit ? "grid grid-cols-3 gap-3" : "grid grid-cols-2 gap-3"}>
        <div>
          <Label className="text-xs">Longitude</Label>
          <Input type="number" step="any" value={lng} readOnly className="h-8 text-sm bg-muted" />
        </div>
        <div>
          <Label className="text-xs">Latitude</Label>
          <Input type="number" step="any" value={lat} readOnly className="h-8 text-sm bg-muted" />
        </div>
        {isEdit && (
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full text-xs"
              onClick={() => {
                useUIStore.getState().setPickMode(true);
                useUIStore.getState().setActiveOverlay("edit");
              }}
            >
              Re-pick
            </Button>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full h-8 text-sm">
        {isSubmitting ? "Saving..." : isEdit ? "Update Entity" : "Create Entity"}
      </Button>
    </form>
  );
}
