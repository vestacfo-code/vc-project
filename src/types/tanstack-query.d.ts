import "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      /** Set on useQuery to avoid reporting failures to Sentry */
      skipSentry?: boolean;
    };
    mutationMeta: {
      skipSentry?: boolean;
    };
  }
}
