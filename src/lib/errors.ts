export type AppErrorCode =
  | "INVALID_INPUT"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_ERROR"
  | "PARSE_ERROR"
  | "NOT_IMPLEMENTED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly httpStatus: number;

  constructor(code: AppErrorCode, message: string, httpStatus: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string) {
    super("INVALID_INPUT", message, 400);
  }
}

export class UpstreamTimeoutError extends AppError {
  constructor(message = "The analysis request timed out. Please try again.") {
    super("UPSTREAM_TIMEOUT", message, 504);
  }
}

export class UpstreamError extends AppError {
  constructor(message = "The AI service failed to analyze this article. Please try again.") {
    super("UPSTREAM_ERROR", message, 502);
  }
}

export class ParseError extends AppError {
  constructor(message = "The AI service returned a response we couldn't understand. Please try again.") {
    super("PARSE_ERROR", message, 502);
  }
}

export class NotImplementedError extends AppError {
  constructor(message: string) {
    super("NOT_IMPLEMENTED", message, 501);
  }
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error && err.name === "AbortError") {
    return new UpstreamTimeoutError();
  }
  return new AppError(
    "INTERNAL_ERROR",
    "Something went wrong while analyzing the article. Please try again.",
    500
  );
}
