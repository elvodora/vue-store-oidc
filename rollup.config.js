// rollup.config.ts
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import alias from "@rollup/plugin-alias";

const config = 
  {
    input: "build/compiled/index.js",
    output: {
      file: "dist/store-oidc.js",
      format: "es",
      sourcemap: true,
    },
    external: ["oidc-client-ts", "pinia", "vue-router"],
    plugins: [
      resolve(),
      typescript(),
      alias({
        entries: [{ find: "src", replacement: "./src" }],
      }),
    ],
  };
export default config;
