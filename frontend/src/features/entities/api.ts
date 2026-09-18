import client from "@/libs/axios";
import type { Entity, EntityInput } from "@/interface/entity.interface";

export async function fetchMap(bbox: string, type?: string, status?: string): Promise<Entity[]> {
  const params: Record<string, string> = { bbox };
  if (type) params.type = type;
  if (status) params.status = status;
  return client.get("/entities/map", { params }) as unknown as Promise<Entity[]>;
}

export async function fetchList(page: number, perPage: number, type?: string, status?: string) {
  const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
  if (type) params.type = type;
  if (status) params.status = status;
  return client.get("/entities", { params }) as unknown as Promise<Entity[]>;
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
