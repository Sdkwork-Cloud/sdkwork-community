export interface IamRuntime {
  tokenManager: {
    getToken: () => string | null;
    setToken: (token: string) => void;
    clearToken: () => void;
  };
}

export function createIamRuntime(): IamRuntime {
  return {
    tokenManager: {
      getToken: () => localStorage.getItem('auth_token'),
      setToken: (token: string) => localStorage.setItem('auth_token', token),
      clearToken: () => localStorage.removeItem('auth_token'),
    },
  };
}