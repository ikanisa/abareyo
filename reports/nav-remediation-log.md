# Navigation Remediation Log

| Route | Issue | Fix |
| --- | --- | --- |
| `/events` | 404 from quick tiles | Added rich schedule page backed by home config events. |
| `/legal/privacy` | Missing legal policy | Implemented privacy summary page with CTA back to support. |
| `/legal/terms` | Missing legal policy | Added terms overview referencing support contacts. |
| `/membership/upgrade` | Linked from membership widget but absent | Created upgrade options page linking back to dashboard. |
| `/profile` | Profile card CTA led to 404 | Added profile landing page pointing to dashboard settings. |
| `/settings` | Settings CTA broken | Implemented settings overview with links to Control Center and about page. |
| `/settings/about` | Missing about route | Added about page referencing legal docs and hotline. |
| `/support` | Quick tile referenced non-existent support page | Added support hub with hotline and email CTAs. |
| `/wallet/history` | Wallet controls pointed to missing history | Added history stub referencing top-up flows. |
| `/wallet/top-up` | Wallet CTA unresolved | Added top-up guidance with USSD + SACCO links. |
| `/more/rewards` | Canonical route missing | Implemented rewards detail page with perks and history. |
| `/events/*` references | Event CTAs caused deep link gaps | Replaced event CTAs with tickets/calendar links within events page. |
