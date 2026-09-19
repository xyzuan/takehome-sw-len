import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { entitySchema, type EntityFormValues } from "@/schemas/entity";
import { useCreateEntity, useUpdateEntity } from "@/services/entity";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { attributesToRows, rowsToAttributes } from "@/utils/attributes";
import type { Entity } from "@/interfaces/entity";

interface EntityFormProps {
  entity?: Entity | null;
  onDone: () => void;
}

export const EntityForm = ({ entity, onDone }: EntityFormProps) => {
  const createMut = useCreateEntity();
  const updateMut = useUpdateEntity();
  const draftLatLng = useUIStore((s) => s.draftLatLng);
  const isEdit = !!entity;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
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
          attributes: attributesToRows(entity.attributes),
        }
      : {
          device_id: "",
          name: "",
          type: "vehicle",
          status: "active",
          description: "",
          lat: draftLatLng?.lat ?? 0,
          lng: draftLatLng?.lng ?? 0,
          attributes: [],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "attributes" });

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
  const attributes = watch("attributes");

  // Sync draft entity for live marker updates during edit and create
  useEffect(() => {
    const attrs = rowsToAttributes(attributes);
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
        attributes: attrs,
      });
    } else if (!isEdit) {
      useUIStore.getState().setDraftEntity({
        id: "__draft__",
        device_id,
        name: name || "New Entity",
        type,
        status,
        description: description || null,
        lat,
        lng,
        attributes: attrs,
        created_at: "",
        updated_at: "",
      });
    }
  }, [isEdit, entity, device_id, name, type, status, description, lat, lng, attributes]);

  const onSubmit = async (values: EntityFormValues) => {
    const payload = { ...values, attributes: rowsToAttributes(values.attributes) };
    try {
      if (isEdit && entity) {
        await updateMut.mutateAsync({ id: entity.id, input: payload });
        useUIStore.getState().setDraftEntity(null);
        useUIStore.getState().setCommittedPos({ lat: values.lat, lng: values.lng });
        useUIStore.getState().setPendingFlyTo({ lat: values.lat, lng: values.lng });
      } else {
        await createMut.mutateAsync(payload);
        useUIStore.getState().setDraftEntity(null);
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
      <TabsContent value="detail" className="space-y-3">
        {/* Row 1: Device ID | Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="device_id" className="text-xs text-muted-foreground mb-1.5">Device ID</Label>
            <Input id="device_id" {...register("device_id")} className="h-8 text-sm" />
            {fieldErrors.device_id && <p className="text-xs text-destructive mt-0.5">{fieldErrors.device_id}</p>}
          </div>
          <div>
            <Label htmlFor="name" className="text-xs text-muted-foreground mb-1.5">Name</Label>
            <Input id="name" {...register("name")} className="h-8 text-sm" />
            {fieldErrors.name && <p className="text-xs text-destructive mt-0.5">{fieldErrors.name}</p>}
          </div>
        </div>

        {/* Row 2: Type | Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setValue("type", v as EntityFormValues["type"])}
              items={{ vehicle: "Vehicle", iot: "IoT", facility: "Facility", other: "Other" }}
            >
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
            <Label className="text-xs text-muted-foreground mb-1.5">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setValue("status", v as EntityFormValues["status"])}
              items={{ active: "Active", inactive: "Inactive", maintenance: "Maintenance" }}
            >
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
          <Label htmlFor="description" className="text-xs text-muted-foreground mb-1.5">Description</Label>
          <Input id="description" {...register("description")} className="h-8 text-sm" />
          {fieldErrors.description && <p className="text-xs text-destructive mt-0.5">{fieldErrors.description}</p>}
        </div>

        {/* Row 4: Long | Lat | Repick */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Longitude</Label>
            <Input type="number" step="any" value={lng} readOnly className="h-8 text-sm bg-muted" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Latitude</Label>
            <Input type="number" step="any" value={lat} readOnly className="h-8 text-sm bg-muted" />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full text-xs"
              onClick={() => {
                useUIStore.getState().setPickMode(true);
                useUIStore.getState().setActiveOverlay(isEdit ? "edit" : "add");
              }}
            >
              Re-pick
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="attributes" className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-1.5">
          <Label className="text-xs text-muted-foreground">Key Name</Label>
          <Label className="text-xs text-muted-foreground">Value</Label>
          <span className="w-9" />
        </div>
        {fields.length === 0 && (
          <p className="text-xs text-muted-foreground py-2 text-center">No attributes. Click "Add" to add key-value pairs.</p>
        )}
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
            <div>
              <Input
                {...register(`attributes.${index}.key`)}
                className="h-8 text-sm"
                placeholder="key"
              />
              {errors.attributes?.[index]?.key && (
                <p className="text-xs text-destructive mt-0.5">{errors.attributes[index].key.message}</p>
              )}
            </div>
            <Input
              {...register(`attributes.${index}.value`)}
              className="h-8 text-sm"
              placeholder="value"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={() => remove(index)}
              aria-label="Remove attribute"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full text-xs"
          onClick={() => append({ key: "", value: "" })}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Attribute
        </Button>
      </TabsContent>

      <Button type="submit" disabled={isSubmitting} className="w-full h-8 text-sm">
        {isSubmitting ? "Saving..." : isEdit ? "Update Entity" : "Create Entity"}
      </Button>
    </form>
  );
}
