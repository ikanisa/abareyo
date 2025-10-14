"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHomeSurface, type HomeSurfaceData } from "@/lib/api/home";

export const HOME_SURFACE_QUERY_KEY = ["home", "surface"] as const;

export const useHomeContent = () =>
  useQuery<HomeSurfaceData>({
    queryKey: HOME_SURFACE_QUERY_KEY,
    queryFn: fetchHomeSurface,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });
