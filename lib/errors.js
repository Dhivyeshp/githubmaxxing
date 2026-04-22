export function getErrorMessage(error, fallback = "Something went wrong") {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    if ("message" in error && typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
    if ("type" in error && typeof error.type === "string" && error.type.trim()) {
      return `${fallback}: ${error.type}`;
    }
  }
  return fallback;
}
