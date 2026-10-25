import { API_ORIGIN } from "../api/client";

// Content Security Policy of the published page: the browser itself refuses
// any connection other than the official Guild Wars 2 API.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `connect-src ${API_ORIGIN}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");
