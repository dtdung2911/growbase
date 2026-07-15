// Must be IDENTICAL across every @supabase/ssr client. Default storageKey is
// derived from the URL hostname (sb-<ref>-auth-token); with a hybrid internal
// URL the browser and server derive different names → PKCE code_verifier cookie
// written by the browser is invisible to the server (pkce_code_verifier_not_found).
export const SUPABASE_STORAGE_KEY = "sb-growbase-auth"
