declare namespace Cloudflare {
  interface Env {
    AUTH_MODE?: "standalone";
    ADMIN_KEY?: string;
    ADMIN_OWNER_ID?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
