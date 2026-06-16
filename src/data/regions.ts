import type { Continent } from '@/data/schema';

export type RegionConfig = {
  /** Unique identifier for this region. */
  id: string;
  /** i18n key for the region's display name. */
  labelKey: string;
  /** Primary continent this region belongs to. */
  continent: Continent;
  /**
   * Parent region IDs, enabling hierarchical grouping and multiple membership.
   * E.g. 'uk' might have parents ['westeuropa', 'nordeuropa'].
   */
  parents?: string[];
};

/**
 * Region configuration skeleton. Populated incrementally as geo-filter UI
 * (Phase 3) matures. Regions support overlapping membership so groups like
 * "British Isles" (UK + Ireland) or "Western Europe" can be formed freely.
 */
export const REGIONS: readonly RegionConfig[] = [
  {
    id: 'westeuropa',
    labelKey: 'regions.westeuropa',
    continent: 'europa',
  },
  {
    id: 'mediterraneum',
    labelKey: 'regions.mediterraneum',
    continent: 'europa',
  },
  {
    id: 'ostasien',
    labelKey: 'regions.ostasien',
    continent: 'asien',
  },
  {
    id: 'naher-osten',
    labelKey: 'regions.naherOsten',
    continent: 'asien',
  },
  {
    id: 'nordafrika',
    labelKey: 'regions.nordafrika',
    continent: 'afrika',
  },
  {
    id: 'mesoamerika',
    labelKey: 'regions.mesoamerika',
    continent: 'amerika',
  },
];
