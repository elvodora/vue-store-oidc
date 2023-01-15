// rollup.config.ts
import dts from "rollup-plugin-dts";
import alias from "@rollup/plugin-alias";

const config = 
  {
    input: "build/compiled/index.d.ts",
    output: {
      file: "dist/store-oidc.d.ts",
      format: "es",
    },
    external: ["oidc-client-ts", "pinia", "vue-router"],
    plugins: [
      dts(),
      alias({
        entries: [{ find: "src", replacement: "./src" }],
      }),
    ],
  };
export default config;
