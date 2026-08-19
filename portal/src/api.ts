/**
 * Portal JSON API client.
 * Implementation is split by domain under ./api/ — this file is the public barrel.
 */
export * from "./api/types";
export {
  ApiError,
  getCsrfToken,
  setCsrfToken,
  setOnSessionActivity,
  setOnUnauthorized,
} from "./api/client";

import { adminApi } from "./api/adminApi";
import { calendarsApi } from "./api/calendarsApi";
import { contactsApi } from "./api/contactsApi";
import { filesApi } from "./api/filesApi";
import { itemsApi } from "./api/itemsApi";
import { sessionApi } from "./api/sessionApi";

export const api = {
  ...sessionApi,
  ...adminApi,
  ...calendarsApi,
  ...contactsApi,
  ...itemsApi,
  ...filesApi,
};
