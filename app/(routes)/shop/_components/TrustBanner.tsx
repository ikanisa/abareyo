"use client";

import { useShopLocale } from "../_hooks/useShopLocale";

const TrustBanner = () => {
  const { t } = useShopLocale();
  return (
    <section className="card break-words whitespace-normal break-words whitespace-normal flex flex-col gap-2 bg-white/5 text-white">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">
        {t("trust.bannerTitle").primary}
        <span className="block text-xs font-normal text-white/60">{t("trust.bannerTitle").secondary}</span>
      </h3>
      <ul className="space-y-2 text-sm text-white/75">
        <li>
          <span className="font-semibold text-white">{t("trust.rowOne").primary}</span>
          <span className="block text-xs text-white/60">{t("trust.rowOne").secondary}</span>
        </li>
        <li>
          {t("trust.rowTwo").primary}
          <span className="block text-xs text-white/60">{t("trust.rowTwo").secondary}</span>
        </li>
        <li>
          {t("trust.rowThree").primary}
          <span className="block text-xs text-white/60">{t("trust.rowThree").secondary}</span>
        </li>
        <li>
          {t("trust.rowFour").primary}
          <span className="block text-xs text-white/60">{t("trust.rowFour").secondary}</span>
        </li>
      </ul>
    </section>
  );
};

export default TrustBanner;
