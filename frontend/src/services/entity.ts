import axios from "axios";
import { useQuery, useMutation, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import client from "@/libs/axios";
import { queryClient } from "@/libs/query";
import { entityKeys } from "@/constants/query-keys";
import type { Entity, EntityInput } from "@/interfaces/entity";
import type { ApiResponse, PaginationMeta } from "@/interfaces/api";

export const useMapEntities = (bbox: string | null, type?: string, status?: string) => {
  return useQuery({
    queryKey: entityKeys.map(bbox ?? "", [type, status].filter(Boolean).join(",")),
    queryFn: async () => {
      const params: Record<string, string> = { bbox: bbox! };
      if (type) params.type = type;
      if (status) params.status = status;
      return client.get("/entities/map", { params }) as unknown as Promise<Entity[]>;
    },
    enabled: !!bbox,
    placeholderData: keepPreviousData,
  });
};

export const useSearchEntities = (search: string, type?: string, status?: string) => {
  return useInfiniteQuery({
    queryKey: entityKeys.list(0, 10, [search, type, status].filter(Boolean).join(",")),
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = { page: String(pageParam), per_page: "10" };
      if (type) params.type = type;
      if (status) params.status = status;
      if (search) params.search = search;
      const res = await axios.get("/api/entities", { params });
      const body = res.data as ApiResponse<Entity[]>;
      return { data: body.data ?? [], meta: (body.meta ?? null) as PaginationMeta | null };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    enabled: search.length > 0,
  });
};

export const useEntity = (id: string | null) => {
  return useQuery({
    queryKey: entityKeys.detail(id ?? ""),
    queryFn: async () => client.get(`/entities/${id}`) as unknown as Promise<Entity>,
    enabled: !!id,
  });
};

export const useCreateEntity = () => {
  return useMutation({
    mutationFn: async (input: EntityInput) => client.post("/entities", input) as unknown as Promise<Entity>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      toast.success("Entity created");
    },
  });
};

export const useUpdateEntity = () => {
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: EntityInput }) =>
      client.put(`/entities/${id}`, input) as unknown as Promise<Entity>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      toast.success("Entity updated");
    },
  });
};

export const useDeleteEntity = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/entities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      toast.success("Entity deleted");
    },
  });
};
