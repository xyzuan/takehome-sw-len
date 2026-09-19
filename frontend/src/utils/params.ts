import type { IQueryRequest } from "@/interfaces/api";

export const generateUrlParams = (query: Partial<IQueryRequest>): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  }
  const str = params.toString();
  return str ? `?${str}` : "";
};
