import { AsyncLocalStorage } from 'async_hooks';

export type RequestContext = {
  requestId: string;
  tenantId?: string;
  userId?: string;
  isPlatformAdmin?: boolean;
  allowDataSourceLookup?: boolean;
  isWebhook?: boolean;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(
  context: RequestContext,
  fn: () => T
) {
  return requestContextStorage.run(context, fn);
}

export function getRequestContext() {
  return requestContextStorage.getStore();
}
