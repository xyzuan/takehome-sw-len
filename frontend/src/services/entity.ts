import axios from "axios";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import client from "@/libs/axios";
import type { Entity, EntityInput } from "@/interfaces/entity";

// API response types
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T | null;
  meta?: PaginationMeta;
  errors?: Record<string, string>;
}

export interface EntityMapResponse extends ApiResponse<Entity[]> {}
export interface EntityListResponse extends ApiResponse<Entity[]> {}
export interface EntityResponse extends ApiResponse<Entity> {}

// Query keys
const entityKeys = {
  map: (bbox: string, filters?: string) => ["entities", "map", bbox, filters] as const,
  list: (page: number, perPage: number, filters?: string) => ["entities", "list", page, perPage, filters] as const,
  detail: (id: string) => ["entities", "detail", id] as const,
};

// API calls
const fetchMap = async (bbox: string, type?: string, status?: string): Promise<Entity[]> => {
  const params: Record<string, string> = { bbox };
  if (type) params.type = type;
  if (status) params.status = status;
  return client.get("/entities/map", { params }) as unknown as Promise<Entity[]>;
}

interface ListResult {
  data: Entity[];
  meta: PaginationMeta | null;
}

const fetchList = async (page: number, perPage: number, type?: string, status?: string, search?: string): Promise<ListResult> => {
  const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
  if (type) params.type = type;
  if (status) params.status = status;
  if (search) params.search = search;
  const res = await axios.get("/api/entities", { params });
  const body = res.data as ApiResponse<Entity[]>;
  return { data: body.data ?? [], meta: body.meta ?? null };
}

const fetchOne = async (id: string): Promise<Entity> => {
  return client.get(`/entities/${id}`) as unknown as Promise<Entity>;
}

const createEntity = async (input: EntityInput): Promise<Entity> => {
  return client.post("/entities", input) as unknown as Promise<Entity>;
}

const updateEntity = async (id: string, input: EntityInput): Promise<Entity> => {
  return client.put(`/entities/${id}`, input) as unknown as Promise<Entity>;
}

const deleteEntity = async (id: string): Promise<void> => {
  await client.delete(`/entities/${id}`);
}

// React Query hooks
export const useMapEntities = (bbox: string | null, type?: string, status?: string) => {
  return useQuery({
    queryKey: entityKeys.map(bbox ?? "", [type, status].filter(Boolean).join(",")),
    queryFn: () => fetchMap(bbox!, type, status),
    enabled: !!bbox,
    placeholderData: keepPreviousData,
  });
}

export const useSearchEntities = (search: string, type?: string, status?: string) => {
  return useInfiniteQuery({
    queryKey: entityKeys.list(0, 10, [search, type, status].filter(Boolean).join(",")),
    queryFn: ({ pageParam }) => fetchList(pageParam, 10, type, status, search),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    enabled: search.length > 0,
  });
}

export const useEntity = (id: string | null) => {
  return useQuery({
    queryKey: entityKeys.detail(id ?? ""),
    queryFn: () => fetchOne(id!),
    enabled: !!id,
  });
}

export const useCreateEntity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EntityInput) => createEntity(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entities"] });
      toast.success("Entity created");
    },
    onError: (err: unknown) => {
      const e = err as { status_code?: number; message?: string };
      toast.error(e?.message ?? "Failed to create entity");
    },
  });
}

export const useUpdateEntity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EntityInput }) => updateEntity(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entities"] });
      toast.success("Entity updated");
    },
    onError: (err: unknown) => {
      const e = err as { status_code?: number; message?: string };
      toast.error(e?.message ?? "Failed to update entity");
    },
  });
}

export const useDeleteEntity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEntity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entities"] });
      toast.success("Entity deleted");
    },
    onError: (err: unknown) => {
      const e = err as { status_code?: number; message?: string };
      toast.error(e?.message ?? "Failed to delete entity");
    },
  });
}
