/**
 * Payment utilities for USSD-only payment flows
 */

export {
  buildUssd,
  formatTelUri,
  formatUssdDisplay,
  isIOS,
  sanitizeAmount,
  sanitizePhoneNumber,
  formatProviderName,
  getProviderShortcode,
  type Provider,
  type BuildUssdOptions,
  type UssdDialerOptions,
  type ClipboardHandoffOptions,
  type ClipboardHandoffResult,
} from "./ussd";
