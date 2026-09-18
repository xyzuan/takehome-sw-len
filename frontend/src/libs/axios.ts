import axios from "axios";
import type { ApiResponse } from "@/interface/entity.interface";

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

// Response interceptor: unwrap the flat envelope.
client.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>;
    if (body.status_code >= 200 && body.status_code < 300) {
      return body.data;
    }
    throw new ApiError(body.status_code, body.message, body.errors);
  },
  (error) => {
    if (error.response?.data) {
      const body = error.response.data as ApiResponse<unknown>;
      throw new ApiError(body.status_code, body.message, body.errors);
    }
    throw new ApiError(0, error.message || "network error");
  },
);

export default client;
