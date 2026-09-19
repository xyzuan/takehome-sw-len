import axios, { type AxiosResponse } from "axios";
import { toast } from "sonner";
import type { ApiResponse } from "@/interfaces/api";

export class ApiError extends Error {
  constructor(
    public status_code: number,
    public message: string,
    public errors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

const isMutationMethod = (method?: string) => {
  const m = (method ?? "").toLowerCase();
  return m === "post" || m === "put" || m === "patch" || m === "delete";
};

// Response interceptor: unwrap the flat envelope + toast results.
client.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>;
    if (body.status_code >= 200 && body.status_code < 300) {
      // Toast success for mutations using the backend's message
      if (isMutationMethod(response.config.method)) {
        toast.success(body.message);
      }
      return body.data as unknown as AxiosResponse;
    }
    const apiError = new ApiError(body.status_code, body.message, body.errors);
    toast.error(apiError.message);
    throw apiError;
  },
  (error) => {
    let apiError: ApiError;
    if (error.response?.data) {
      const body = error.response.data as ApiResponse<unknown>;
      apiError = new ApiError(body.status_code, body.message, body.errors);
    } else {
      apiError = new ApiError(0, error.message || "network error");
    }
    toast.error(apiError.message);
    throw apiError;
  },
);

export default client;
