import { getEnvironment } from './environment';

export interface Runtime {
  environment: ReturnType<typeof getEnvironment>;
}

export function createRuntime(): Runtime {
  return {
    environment: getEnvironment(),
  };
}