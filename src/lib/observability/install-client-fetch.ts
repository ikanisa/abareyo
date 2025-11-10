import { installFetchInterceptor } from "@/lib/observability/fetch-interceptor";

if (typeof window !== "undefined") {
  installFetchInterceptor();
}
