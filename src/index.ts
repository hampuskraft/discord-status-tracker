import {Env} from './types';
import {checkForUpdates} from './utils';

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await checkForUpdates(env);
  },
};
