// rollup.config.js
import { nodeResolve as resolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from "rollup-plugin-dts";

const config = [{
	input: 'build/compiled/index.js',
	output: {
		file: 'dist/store-oidc.js',
		format: 'cjs',
		sourcemap: true,
	},
	external: ['oidc-client-ts', 'pinia', 'vue-router'],
	plugins: [resolve(), typescript()]
}, {
	input: 'build/compiled/index.d.ts',
	output: {
		file: 'dist/store-oidc.d.ts',
		format: 'es'
	},
	external: ['oidc-client-ts', 'pinia', 'vue-router'],
	plugins: [dts()]
}];
export default config;
