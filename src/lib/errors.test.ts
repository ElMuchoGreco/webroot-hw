import { describe, expect, it } from "vitest";

import {
  AppError,
  InvalidInputError,
  NotImplementedError,
  ParseError,
  UpstreamError,
  UpstreamTimeoutError,
  toAppError,
} from "@/lib/errors";

describe("error classes", () => {
  it("InvalidInputError maps to 400", () => {
    const err = new InvalidInputError("bad input");
    expect(err.code).toBe("INVALID_INPUT");
    expect(err.httpStatus).toBe(400);
  });

  it("UpstreamTimeoutError maps to 504", () => {
    const err = new UpstreamTimeoutError();
    expect(err.code).toBe("UPSTREAM_TIMEOUT");
    expect(err.httpStatus).toBe(504);
  });

  it("UpstreamError maps to 502", () => {
    const err = new UpstreamError();
    expect(err.code).toBe("UPSTREAM_ERROR");
    expect(err.httpStatus).toBe(502);
  });

  it("ParseError maps to 502", () => {
    const err = new ParseError();
    expect(err.code).toBe("PARSE_ERROR");
    expect(err.httpStatus).toBe(502);
  });

  it("NotImplementedError maps to 501", () => {
    const err = new NotImplementedError("not done yet");
    expect(err.code).toBe("NOT_IMPLEMENTED");
    expect(err.httpStatus).toBe(501);
  });
});

describe("toAppError", () => {
  it("passes an existing AppError through unchanged", () => {
    const original = new InvalidInputError("bad input");
    expect(toAppError(original)).toBe(original);
  });

  it("maps an AbortError (timeout/cancellation) to UpstreamTimeoutError", () => {
    const abortErr = new Error("The operation was aborted");
    abortErr.name = "AbortError";

    const mapped = toAppError(abortErr);
    expect(mapped).toBeInstanceOf(UpstreamTimeoutError);
    expect(mapped.httpStatus).toBe(504);
  });

  it("maps an unexpected/unknown error to a generic 500 rather than leaking internals", () => {
    const mapped = toAppError(new Error("some internal database error with a stack trace"));
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped.code).toBe("INTERNAL_ERROR");
    expect(mapped.httpStatus).toBe(500);
    expect(mapped.message).not.toMatch(/database/i);
  });

  it("maps a thrown non-Error value to a generic 500 without crashing", () => {
    const mapped = toAppError("a string was thrown, not an Error");
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped.code).toBe("INTERNAL_ERROR");
  });
});
