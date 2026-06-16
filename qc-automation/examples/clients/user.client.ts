import type { APIRequestContext, APIResponse } from '@playwright/test';

// Service-client layer (see references/code-structure.md): wraps the endpoints,
// keeps request shape in one place, holds no assertions.
export class UserClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseURL: string,
  ) {}

  list(): Promise<APIResponse> {
    return this.request.get(`${this.baseURL}/users`);
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(`${this.baseURL}/users/${id}`);
  }
}
