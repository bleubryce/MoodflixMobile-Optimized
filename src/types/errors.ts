export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public method: string,
    public response?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class CacheError extends Error {
  constructor(
    message: string,
    public key: string,
    public operation: "read" | "write" | "delete",
  ) {
    super(message);
    this.name = "CacheError";
  }
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public operation: "create" | "read" | "update" | "delete",
    public table: string,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class NotificationError extends Error {
  constructor(
    message: string,
    public type: "permission" | "registration" | "delivery",
    public deviceToken?: string,
  ) {
    super(message);
    this.name = "NotificationError";
  }
}

export class SubscriptionError extends Error {
  constructor(
    message: string,
    public readonly channel: string,
    public readonly operation: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "SubscriptionError";
  }
}
