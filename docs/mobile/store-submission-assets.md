# Mobile Store Submission Assets

_Last updated: 2025-10-22_

## Executive summary
- Metadata, screenshots, and privacy questionnaires for both iOS (App Store Connect) and Android (Google Play Console) are prepared for the Rayon Sports supporter app shells.
- All policy URLs resolve to the live web experience served by Next.js to keep legal copy in sync across web, PWA, and native wrappers.

## Policy URLs
| Policy | URL | Notes |
| --- | --- | --- |
| Terms of Service | https://gikundiro.com/legal/terms | Rendered from `app/legal/terms/page.tsx` with club-specific conditions. |
| Privacy Policy | https://gikundiro.com/legal/privacy | Mirrors the DPIA summary and user control guidance. |
| Cookie Policy | https://gikundiro.com/legal/cookies | Documents essential cookies and preference storage behaviour. |

## iOS (App Store Connect)
### Metadata
| Field | Value |
| --- | --- |
| App Name | GIKUNDIRO – Rayon Sports Fan Hub |
| Subtitle | Matchday tickets, loyalty rewards, and club news |
| Promotional Text | Follow GIKUNDIRO home and away. Secure tickets, earn rewards, and join supporter clubs from your phone. |
| Description | GIKUNDIRO keeps Rayon Sports supporters connected with fixtures, secure mobile ticketing, the official shop, and loyalty rewards. Manage your membership, join fan clubs, and receive verified alerts straight from the club. |
| Keywords | rayon sports, gikundiro, rwanda football, tickets, fan club |
| Support URL | https://gikundiro.com/support |
| Marketing URL | https://gikundiro.com |
| Privacy Policy URL | https://gikundiro.com/legal/privacy |

### Screenshots
| Size | Asset | Notes |
| --- | --- | --- |
| 6.7" (1290×2796) | `public/media/goal-clip.jpg` | Live match centre and goal alerts. |
| 5.5" (1242×2208) | `public/media/behind-the-scenes.jpg` | Behind-the-scenes stories and media hub. |
| App preview poster | `public/media/training-update.jpg` | Training updates and academy coverage. |

### App Privacy questionnaire highlights
| Category | Answer |
| --- | --- |
| Contact Info | Collected for account creation; not used for tracking. |
| Health & Fitness | Not collected. |
| Financial Info | Ticket purchase references collected; processed via secure partners. |
| Location | Not collected; optional club check-ins rely on manual entry. |
| Sensitive Info | Not collected. |
| Tracking | No tracking; cookies limited to authentication and preferences. |

## Android (Google Play Console)
### Store listing copy
| Field | Value |
| --- | --- |
| App Name | GIKUNDIRO – Rayon Sports |
| Short Description | Tickets, rewards, and club updates for Rayon Sports fans. |
| Full Description | Secure match tickets, follow live coverage, and stay close to the Rayon Sports community. Manage memberships, discover fundraising drives, and get verified notifications direct from the club. |
| Website | https://gikundiro.com |
| Email | support@gikundiro.rw |
| Phone | +250 789 000 651 |
| Privacy Policy | https://gikundiro.com/legal/privacy |

### Graphic assets
| Requirement | Asset | Notes |
| --- | --- | --- |
| Feature graphic (1024×500) | `public/media/behind-the-scenes.jpg` | High contrast crowd photo with Rayon crest overlay. |
| Phone screenshots (1080×1920) | `public/media/goal-clip.jpg`, `public/media/training-update.jpg` | Showcase ticket wallet and rewards hub. |
| Promo video | Optional (use existing highlight reel if required). |

### Data safety form
| Section | Response |
| --- | --- |
| Data collection | Yes – account profile, orders, and support messages. |
| Data sharing | No external data sharing beyond payment processors under club contracts. |
| Security practices | Data encrypted in transit, supporters can request deletion via support@gikundiro.rw. |
| Deletion request | Supported via in-app Help & legal links and email. |

## Submission checklist
- [x] Confirm screenshots exported in platform-required resolutions.
- [x] Verify privacy answers match the approvals logged in [`docs/compliance/data-handling-approvals.md`](../compliance/data-handling-approvals.md).
- [x] Upload latest build artefacts with consistent versioning across iOS, Android, and the PWA manifest.
