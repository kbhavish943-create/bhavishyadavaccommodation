// Temporary TypeScript shims to quiet editor errors when node_modules are not installed.
// These are safe non-invasive shims — prefer installing proper types in dev environment.

declare namespace React {
  type ChangeEvent<T extends Element> = { target: T; currentTarget: T; preventDefault?(): void; stopPropagation?(): void; } & any;
  type FormEvent<T extends HTMLFormElement> = { preventDefault(): void; currentTarget: T; } & any;
}

declare module 'react' {
  export function useState<S = any>(initialState: S | (() => S)) : [S, (s: S | ((prev: S) => S)) => void];
  export function useEffect(cb: (...args: any[]) => any, deps?: any[]): void;
  export function useRef<T = any>(initial?: T): { current: T };
  export function useMemo<T>(fn: () => T, deps?: any[]): T;
  export function useCallback<T extends (...args: any[]) => any>(fn: T, deps?: any[]): T;
  namespace React {
    type ChangeEvent<T extends Element> = { target: T; currentTarget: T; preventDefault?(): void; stopPropagation?(): void; } & any;
    type FormEvent<T extends HTMLFormElement> = { preventDefault(): void; currentTarget: T; } & any;
  }
  const React: any;
  export default React;
}

declare module 'react-dom' {
  const ReactDOM: any;
  export default ReactDOM;
}

declare module '@stripe/react-stripe-js';
declare module 'stripe';

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Allow importing CSS modules in TS files (if used)
declare module '*.css';

// Minimal process shim for client-side environment in editor
declare const process: any;
