import type { Env } from "./types";
import { checkForUpdates } from "./utils";

export default {
	async scheduled(_event, env, _ctx) {
		await checkForUpdates(env);
	},
} satisfies ExportedHandler<Env>;
