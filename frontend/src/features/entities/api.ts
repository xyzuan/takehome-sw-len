import axios from "axios";
import client from "@/libs/axios";
import type { Entity, EntityInput, ApiResponse, PaginationMeta } from "@/interface/entity.interface";

export async function fetchMap(bbox: string, type?: string, status?: string): Promise<Entity[]> {
  const params: Record<string, string> = { bbox };
  if (type) params.type = type;
  if (status) params.status = status;
  return client.get("/entities/map", { params }) as unknown as Promise<Entity[]>;
}

export interface ListResult {
  data: Entity[];
  meta: PaginationMeta | null;
}

export async function fetchList(page: number, perPage: number, type?: string, status?: string, search?: string): Promise<ListResult> {
  const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
  if (type) params.type = type;
  if (status) params.status = status;
  if (search) params.search = search;
  // Use raw axios to get the full envelope (interceptor strips it)
  const res = await axios.get("/api/entities", { params });
  const body = res.data as ApiResponse<Entity[]>;
  return { data: body.data ?? [], meta: body.meta ?? null };
}

export async function fetchOne(id: string): Promise<Entity> {
  return client.get(`/entities/${id}`) as unknown as Promise<Entity>;
}

export async function createEntity(input: EntityInput): Promise<Entity> {
  return client.post("/entities", input) as unknown as Promise<Entity>;
}

export async function updateEntity(id: string, input: EntityInput): Promise<Entity> {
  return client.put(`/entities/${id}`, input) as unknown as Promise<Entity>;
}

export async function deleteEntity(id: string): Promise<void> {
  await client.delete(`/entities/${id}`);
}
