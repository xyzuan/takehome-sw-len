import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { entityKeys } from "@/consts/query-key";
import { fetchMap, fetchList, fetchOne, createEntity, updateEntity, deleteEntity } from "./api";
import type { EntityInput } from "@/interface/entity.interface";
import { toast } from "sonner";

export function useMapEntities(bbox: string | null, type?: string, status?: string) {
  return useQuery({
    queryKey: entityKeys.map(bbox ?? "", [type, status].filter(Boolean).join(",")),
    queryFn: () => fetchMap(bbox!, type, status),
    enabled: !!bbox,
    placeholderData: keepPreviousData,
  });
}

export function useSearchEntities(search: string, type?: string, status?: string) {
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

export function useEntity(id: string | null) {
  return useQuery({
    queryKey: entityKeys.detail(id ?? ""),
    queryFn: () => fetchOne(id!),
    enabled: !!id,
  });
}

export function useCreateEntity() {
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

export function useUpdateEntity() {
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

export function useDeleteEntity() {
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
