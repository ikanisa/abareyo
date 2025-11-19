import { z } from "zod";

export type ContractVersionEntry<TSchemas> = {
  version: string;
  introducedAt: string;
  schemas: TSchemas;
  changes: string[];
  deprecated?: {
    reason: string;
    sunsetAt?: string;
  };
};

export type DeprecationPolicy = {
  minimumSupportDays: number;
  notes?: string;
};

export type VersionedContracts<TSchemas> = {
  domain: string;
  policy: DeprecationPolicy;
  versions: ContractVersionEntry<TSchemas>[];
  latest: ContractVersionEntry<TSchemas>;
  versionMap: Record<string, ContractVersionEntry<TSchemas>>;
  changelog: ContractVersionEntry<TSchemas>[];
  deprecated: ContractVersionEntry<TSchemas>[];
};

export const defineVersionedContracts = <TSchemas>(options: {
  domain: string;
  policy: DeprecationPolicy;
  versions: ContractVersionEntry<TSchemas>[];
}): VersionedContracts<TSchemas> => {
  const sortedVersions = [...options.versions].sort((a, b) => a.version.localeCompare(b.version));
  const versionMap = sortedVersions.reduce<Record<string, ContractVersionEntry<TSchemas>>>(
    (acc, entry) => ({ ...acc, [entry.version]: entry }),
    {},
  );

  const deprecated = sortedVersions.filter((entry) => Boolean(entry.deprecated));

  return {
    domain: options.domain,
    policy: options.policy,
    versions: sortedVersions,
    latest: sortedVersions[sortedVersions.length - 1],
    versionMap,
    changelog: sortedVersions,
    deprecated,
  } satisfies VersionedContracts<TSchemas>;
};

export const isoDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}/, {
  message: "Expected ISO-8601 date string",
});
