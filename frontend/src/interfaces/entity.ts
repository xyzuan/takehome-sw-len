import type { EntityType, EntityStatus } from "@/types/entity";
import type { ApiResponse } from "./api";

export interface Entity {
  id: string;
  device_id: string;
  name: string;
  type: EntityType;
  status: EntityStatus;
  description: string | null;
  lat: number;
  lng: number;
  attributes: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface EntityInput {
  device_id: string;
  name: string;
  type: EntityType;
  status: EntityStatus;
  description?: string;
  lat: number;
  lng: number;
  attributes?: Record<string, unknown>;
}

export interface EntityMapResponse extends ApiResponse<Entity[]> {}
export interface EntityListResponse extends ApiResponse<Entity[]> {}
export interface EntityResponse extends ApiResponse<Entity> {}
