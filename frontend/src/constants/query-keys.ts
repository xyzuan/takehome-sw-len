export const entityKeys = {
  map: (bbox: string, filters?: string) => ["entities", "map", bbox, filters] as const,
  list: (page: number, perPage: number, filters?: string) => ["entities", "list", page, perPage, filters] as const,
  detail: (id: string) => ["entities", "detail", id] as const,
};
