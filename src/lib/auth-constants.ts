export const SESSION_COOKIE = "tc_session";
export const PENDING_2FA_COOKIE = "tc_2fa_pending";
export const TRUSTED_2FA_COOKIE = "tc_2fa_trust";

/** Legacy names; still accepted so existing sessions keep working. */
export const LEGACY_SESSION_COOKIE = "wms_session";
export const LEGACY_PENDING_2FA_COOKIE = "wms_2fa_pending";
export const LEGACY_TRUSTED_2FA_COOKIE = "wms_2fa_trust";

/** Skip authenticator codes on this browser for this many days after a successful 2FA. */
export const TRUSTED_2FA_DAYS = 7;
export const MIN_PASSWORD_LENGTH = 8;
