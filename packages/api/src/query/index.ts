import {
  queryOptions,
  type MutationKey,
  type QueryKey,
  type QueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { z } from "zod";

import { createApiFetcher } from "../http/fetcher";
import type { ApiError, ApiFetcher, ApiFetcherConfig, RequestOptions } from "../http/fetcher";

export type MutationRequestOptions<TInput> = Omit<RequestOptions<TInput>, "body">;

export const createQueryAdapter = (fetcher: ApiFetcher) => {
  return {
    queryOptions: <TOutput, TQueryKey extends QueryKey = QueryKey>(
      config: {
        queryKey: TQueryKey;
        path: string;
        schema: z.ZodType<TOutput>;
        request?: RequestOptions<unknown>;
      } & Omit<QueryOptions<TOutput, ApiError, TOutput, TQueryKey>, "queryKey" | "queryFn">,
    ) => {
      const { queryKey, path, schema, request, ...rest } = config;
      return queryOptions<TOutput, ApiError, TOutput, TQueryKey>({
        ...rest,
        queryKey,
        queryFn: () => fetcher(path, schema, request),
      });
    },
    mutationOptions: <TOutput, TVariables = void, TContext = unknown>(
      config: {
        path: string;
        schema: z.ZodType<TOutput>;
        request?: MutationRequestOptions<TVariables>;
        mutationKey?: MutationKey;
      } & Omit<UseMutationOptions<TOutput, ApiError, TVariables, TContext>, "mutationFn">,
    ): UseMutationOptions<TOutput, ApiError, TVariables, TContext> => {
      const { path, schema, request, ...rest } = config;
      return {
        ...rest,
        mutationFn: async (variables: TVariables) =>
          fetcher(path, schema, { ...(request ?? {}), body: variables }),
      };
    },
  };
};

export const createValidatedQueryAdapter = (config?: ApiFetcherConfig) =>
  createQueryAdapter(createApiFetcher(config));

export type QueryAdapter = ReturnType<typeof createQueryAdapter>;
