import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

// Standalone hosting: no Sites identity mocks or connector preview services.
export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      configPath: "wrangler.cloudflare.jsonc",
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      inspectorPort: false,
    }),
  ],
});
