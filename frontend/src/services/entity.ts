import { useQuery, useMutation, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import client from "@/libs/axios";
import { queryClient } from "@/libs/query";
import { QKEY_ENTITIES_MAP, QKEY_ENTITIES_LIST, QKEY_ENTITY_DETAIL, QKEY_ENTITIES } from "@/constants/query-keys";
import { generateUrlParams } from "@/utils/params";
import type { Entity, EntityInput, EntityQueryParams } from "@/interfaces/entity";
import type { ApiResponse, IQueryRequest } from "@/interfaces/api";

type MapQuery = IQueryRequest & EntityQueryParams;

export const useMapEntities = (query: MapQuery) =>
  useQuery({
    queryKey: [QKEY_ENTITIES_MAP, { ...query }],
    queryFn: async (): Promise<ApiResponse<Entity[]>> =>
      client.get(`/entities/map${generateUrlParams(query)}`).then((res) => res.data),
    enabled: !!query.bbox,
    placeholderData: keepPreviousData,
  });

export const useSearchEntities = (query: IQueryRequest & EntityQueryParams) =>
  useInfiniteQuery({
    queryKey: [QKEY_ENTITIES_LIST, { ...query }],
    queryFn: async ({ pageParam }): Promise<ApiResponse<Entity[]>> =>
      client
        .get(`/entities${generateUrlParams({ ...query, page: pageParam, per_page: 10 })}`)
        .then((res) => res.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      return lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined;
    },
    enabled: !!query.search && query.search.length > 0,
  });

export const useEntity = (id: string | null) =>
  useQuery({
    queryKey: [QKEY_ENTITY_DETAIL, id ?? ""],
    queryFn: async (): Promise<ApiResponse<Entity>> =>
      client.get(`/entities/${id}`).then((res) => res.data),
    enabled: !!id,
  });

export const useCreateEntity = () =>
  useMutation({
    mutationFn: async (input: EntityInput): Promise<ApiResponse<Entity>> =>
      client.post("/entities", input).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QKEY_ENTITIES] });
    },
  });

export const useUpdateEntity = () =>
  useMutation({
    mutationFn: async ({ id, input }: { id: string; input: EntityInput }): Promise<ApiResponse<Entity>> =>
      client.put(`/entities/${id}`, input).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QKEY_ENTITIES] });
    },
  });

export const useDeleteEntity = () =>
  useMutation({
    mutationFn: async (id: string): Promise<ApiResponse<null>> =>
      client.delete(`/entities/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QKEY_ENTITIES] });
    },
  });
