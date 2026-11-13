-- One-time production setup, 2026-11-13. Safe to run more than once.
--   1. Stripe product and price ids for the paid plans (OptinYeti Stripe account, test mode until the
--      business is verified; swap in the live ids once Stripe issues them).
--   2. Joe's tenant (5) moves to Enterprise so the account is not capped at 3 popups.
--   3. Every Red Wagon site on the KVM 4 registered under tenant 5 so popups can be scoped per site.
-- Run: sqlite3 /srv/apps/optinyeti/PopupManager.db < plans_and_sites.sql

UPDATE SubscriptionPlans SET
  StripeProductId = 'prod_VcRlH0sp6xC4Tc',
  StripePriceIdMonthly = 'price_1UbCryLL3dyzwJSzDFCY7ESP',
  StripePriceIdYearly = 'price_1UbDBtLL3dyzwJSzM8k4bHVt'
WHERE Name = 'Professional';

UPDATE SubscriptionPlans SET
  StripeProductId = 'prod_VcSOQGxVMiyndI',
  StripePriceIdMonthly = 'price_1UbDTaLL3dyzwJSzn8qKx9ii',
  StripePriceIdYearly = 'price_1UbKxjLL3dyzwJSzl22h5j6t'
WHERE Name = 'Enterprise';

UPDATE Tenants SET SubscriptionPlanId = (SELECT Id FROM SubscriptionPlans WHERE Name = 'Enterprise') WHERE Id = 5;

INSERT OR IGNORE INTO Sites (TenantId, Domain, Name, WebhookUrl, CreatedAt, UpdatedAt)
SELECT 5, d, n, NULL, strftime('%Y-%m-%d %H:%M:%S', 'now'), strftime('%Y-%m-%d %H:%M:%S', 'now') FROM (
  SELECT 'optinyeti.com' AS d, 'OptinYeti' AS n UNION ALL
  SELECT 'redwagon.agency', 'Red Wagon' UNION ALL
  SELECT 'josephwhyte.com', 'Joe Whyte' UNION ALL
  SELECT 'competitorinbox.com', 'CompetitorInbox' UNION ALL
  SELECT 'e-mailgrader.com', 'E-Mail Grader' UNION ALL
  SELECT 'markitech.app', 'Markitech' UNION ALL
  SELECT 'ppcgrader.com', 'PPC Grader' UNION ALL
  SELECT 'searchauditpro.com', 'SearchAuditPro' UNION ALL
  SELECT 'threadlyhq.com', 'Threadly' UNION ALL
  SELECT 'unboundkeyword.com', 'UnboundKeyword'
);

SELECT 'plans', Name, StripePriceIdMonthly, StripePriceIdYearly FROM SubscriptionPlans WHERE StripeProductId IS NOT NULL AND StripeProductId <> '';
SELECT 'tenant5_plan', (SELECT Name FROM SubscriptionPlans WHERE Id = SubscriptionPlanId) FROM Tenants WHERE Id = 5;
SELECT 'sites', count(*) FROM Sites WHERE TenantId = 5;
