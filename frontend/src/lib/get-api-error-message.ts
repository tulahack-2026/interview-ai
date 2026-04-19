import type { AxiosError } from "axios";
import type { components } from "@/types/api";

type ValidationError = components["schemas"]["HTTPValidationError"];

export function getApiErrorMessage(error: unknown, fallback = "Произошла ошибка"): string {
  if (typeof error === "object" && error !== null && "isAxiosError" in error) {
    const ax = error as AxiosError<ValidationError>;
    const data = ax.response?.data;
    if (data && Array.isArray(data.detail) && data.detail.length > 0) {
      return data.detail.map((d) => d.msg).join("; ");
    }
    if (ax.response?.status === 401) {
      return "Требуется вход в систему";
    }
    if (typeof ax.message === "string" && ax.message) {
      return ax.message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
