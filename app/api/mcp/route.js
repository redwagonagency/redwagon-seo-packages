/**
 * MCP (Model Context Protocol) — Streamable HTTP endpoint for SearchAuditPro
 * Auth: Bearer token via MCP_SECRET env var (required — no fallback)
 * Endpoint: https://searchauditpro.com/api/mcp
 */
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getGa4Report, getGa4PageViews, getGa4Properties, getGa4Realtime } from '@/lib/integrations/google-analytics';
import { getGscSearchAnalytics, getGscSites, getGscSitemaps, refreshGoogleToken } from '@/lib/integrations/google-search-console';
import { getSemrushDomainOverview, getSemrushOrganicKeywords, getSemrushKeywordOverview, getSemrushCompetitors } from '@/lib/integrations/semrush';
import { getBingSites, getBingRankAndTrafficStats, getBingQueryStats, getBingCrawlStats } from '@/lib/integrations/bing-webmaster';

const prisma = new PrismaClient();
const MCP_SECRET = process.env.MCP_SECRET;
const SITE = 'searchauditpro';

// Tool definitions
const TOOLS = [
  {
    name: 'list_projects',
    description: 'List all SEO audit projects in SearchAuditPro with their latest status.',
    inputSchema: { type: 'object', properties: { limit: { type: 'number', description: 'Max results (default 20)' } } }
  },
  {
    name: 'get_project_audits',
    description: 'Get site audit results for a specific project by project ID.',
    inputSchema: { type: 'object', required: ['projectId'], properties: { projectId: { type: 'string' } } }
  },
  {
    name: 'keyword_research',
    description: 'Get keyword research data for a domain. Returns top keywords tracked.',
    inputSchema: { type: 'object', required: ['projectId'], properties: { projectId: { type: 'string' }, limit: { type: 'number' } } }
  },
  {
    name: 'get_site_stats',
    description: 'Get aggregate stats: total users, projects, audits, rank trackers.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'list_tenants',
    description: 'List all tenants (client organizations) with their plan and project count.',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' } } }
  },
  {
    name: 'create_tenant_user',
    description: 'Onboard a new client: creates a Tenant (organization), a User login, and links them as the tenant OWNER. Password must be provided by the caller (generate one securely beforehand); it is never echoed back.',
    inputSchema: {
      type: 'object',
      required: ['email', 'name', 'tenantName', 'password'],
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
        tenantName: { type: 'string' },
        tenantSlug: { type: 'string', description: 'Optional; derived from tenantName if omitted' },
        password: { type: 'string', description: 'Temporary password; caller should require a change on first login' },
        plan: { type: 'string', description: 'Tenant plan (default STARTER)' }
      }
    }
  },
  {
    name: 'get_ga4_report',
    description: 'Get GA4 traffic-by-source report for a project. Requires the project\'s tenant to have a connected google_analytics Integration.',
    inputSchema: { type: 'object', required: ['projectId', 'propertyId', 'startDate', 'endDate'], properties: { projectId: { type: 'string' }, propertyId: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' } } }
  },
  {
    name: 'get_ga4_pageviews',
    description: 'Get GA4 top pages by pageviews for a project.',
    inputSchema: { type: 'object', required: ['projectId', 'propertyId', 'startDate', 'endDate'], properties: { projectId: { type: 'string' }, propertyId: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' } } }
  },
  {
    name: 'get_ga4_properties',
    description: 'List GA4 properties visible to the connected Google account for a project\'s tenant.',
    inputSchema: { type: 'object', required: ['projectId'], properties: { projectId: { type: 'string' } } }
  },
  {
    name: 'get_search_console_data',
    description: 'Get Google Search Console search analytics (queries + pages) for a project. Requires a connected google_search_console Integration.',
    inputSchema: { type: 'object', required: ['projectId', 'siteUrl', 'startDate', 'endDate'], properties: { projectId: { type: 'string' }, siteUrl: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' } } }
  },
  {
    name: 'get_semrush_domain_overview',
    description: 'Get Semrush domain overview (rank, organic traffic/cost, ads) for a domain.',
    inputSchema: { type: 'object', required: ['domain'], properties: { domain: { type: 'string' }, database: { type: 'string', description: 'Semrush country database, default us' } } }
  },
  {
    name: 'get_semrush_organic_keywords',
    description: 'Get a domain\'s top organic keywords from Semrush.',
    inputSchema: { type: 'object', required: ['domain'], properties: { domain: { type: 'string' }, database: { type: 'string' }, limit: { type: 'number' } } }
  },
  {
    name: 'get_semrush_keyword_overview',
    description: 'Get Semrush volume/CPC/competition overview for a single keyword.',
    inputSchema: { type: 'object', required: ['keyword'], properties: { keyword: { type: 'string' }, database: { type: 'string' } } }
  },
  {
    name: 'get_semrush_competitors',
    description: 'Get a domain\'s top organic competitors from Semrush.',
    inputSchema: { type: 'object', required: ['domain'], properties: { domain: { type: 'string' }, database: { type: 'string' }, limit: { type: 'number' } } }
  },
  {
    name: 'get_bing_webmaster_data',
    description: 'Get Bing Webmaster Tools rank/traffic/query stats for a verified site.',
    inputSchema: { type: 'object', required: ['siteUrl'], properties: { siteUrl: { type: 'string' }, kind: { type: 'string', description: "'rank_traffic' | 'query_stats' | 'crawl_stats' | 'sites' (default rank_traffic)" } } }
  }
];

function authCheck(req) {
  if (!MCP_SECRET) return false; // fail closed if not configured
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return token === MCP_SECRET;
}

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function getTenantIdForProject(projectId) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { tenantId: true } });
  if (!project) throw new Error(`Project not found: ${projectId}`);
  return project.tenantId;
}

async function getGoogleAccessToken(tenantId, provider) {
  const integration = await prisma.integration.findUnique({ where: { tenantId_provider: { tenantId, provider } } });
  if (!integration || !integration.accessToken) {
    throw new Error(`No connected ${provider} integration for this tenant`);
  }
  if (integration.expiresAt && new Date(integration.expiresAt) <= new Date()) {
    if (!integration.refreshToken) throw new Error(`${provider} token expired and no refresh token on file`);
    const refreshed = await refreshGoogleToken(integration.refreshToken);
    if (!refreshed.access_token) throw new Error(`Failed to refresh ${provider} token`);
    const expiresAt = refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000) : null;
    await prisma.integration.update({
      where: { tenantId_provider: { tenantId, provider } },
      data: { accessToken: refreshed.access_token, expiresAt }
    });
    return refreshed.access_token;
  }
  return integration.accessToken;
}

async function callTool(name, args) {
  switch (name) {
    case 'list_projects': {
      const limit = args?.limit || 20;
      const projects = await prisma.project.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, domain: true, createdAt: true, _count: { select: { siteAudits: true, rankTrackers: true } } }
      }).catch(() => []);
      return { projects: projects.map(p => ({ id: p.id, domain: p.domain, audits: p._count.siteAudits, rankTrackers: p._count.rankTrackers, created: p.createdAt })) };
    }
    case 'get_project_audits': {
      const audits = await prisma.siteAudit.findMany({
        where: { projectId: args.projectId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, score: true, issues: true, createdAt: true }
      }).catch(() => []);
      return { audits: audits.map(a => ({ id: a.id, status: a.status, score: a.score, issues: a.issues, created: a.createdAt })) };
    }
    case 'keyword_research': {
      const keywords = await prisma.rankTracker.findMany({
        where: { projectId: args.projectId },
        take: args?.limit || 50,
        select: { keyword: true, position: true, previousPosition: true, searchVolume: true }
      }).catch(() => []);
      return { keywords };
    }
    case 'get_site_stats': {
      const [users, projects, audits] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.project.count().catch(() => 0),
        prisma.siteAudit.count().catch(() => 0),
      ]);
      return { site: SITE, users, projects, audits, timestamp: new Date().toISOString() };
    }
    case 'list_tenants': {
      const tenants = await prisma.tenant.findMany({
        take: args?.limit || 50,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, slug: true, plan: true, createdAt: true, _count: { select: { projects: true, members: true } } }
      });
      return { tenants: tenants.map(t => ({ id: t.id, name: t.name, slug: t.slug, plan: t.plan, projects: t._count.projects, members: t._count.members, created: t.createdAt })) };
    }
    case 'create_tenant_user': {
      const { email, name, tenantName, password, plan } = args;
      let tenantSlug = args.tenantSlug || slugify(tenantName);
      const existingSlug = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (existingSlug) tenantSlug = `${tenantSlug}-${Math.random().toString(36).slice(2, 6)}`;

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        const hash = await bcrypt.hash(password, 10);
        user = await prisma.user.create({ data: { email, name, password: hash, role: 'USER' } });
      }

      const tenant = await prisma.tenant.create({ data: { name: tenantName, slug: tenantSlug, plan: plan || 'STARTER' } });
      await prisma.tenantMember.create({ data: { tenantId: tenant.id, userId: user.id, role: 'OWNER' } });

      return { userId: user.id, email: user.email, tenantId: tenant.id, tenantSlug: tenant.slug, note: 'Password was not stored in this response. Require a password change on first login.' };
    }
    case 'get_ga4_report': {
      const tenantId = await getTenantIdForProject(args.projectId);
      const token = await getGoogleAccessToken(tenantId, 'google_analytics');
      return getGa4Report(token, args.propertyId, args.startDate, args.endDate);
    }
    case 'get_ga4_pageviews': {
      const tenantId = await getTenantIdForProject(args.projectId);
      const token = await getGoogleAccessToken(tenantId, 'google_analytics');
      return getGa4PageViews(token, args.propertyId, args.startDate, args.endDate);
    }
    case 'get_ga4_properties': {
      const tenantId = await getTenantIdForProject(args.projectId);
      const token = await getGoogleAccessToken(tenantId, 'google_analytics');
      return getGa4Properties(token);
    }
    case 'get_search_console_data': {
      const tenantId = await getTenantIdForProject(args.projectId);
      const token = await getGoogleAccessToken(tenantId, 'google_search_console');
      return getGscSearchAnalytics(token, args.siteUrl, args.startDate, args.endDate);
    }
    case 'get_semrush_domain_overview':
      return getSemrushDomainOverview(args.domain, args.database);
    case 'get_semrush_organic_keywords':
      return { keywords: await getSemrushOrganicKeywords(args.domain, args.database, args.limit) };
    case 'get_semrush_keyword_overview':
      return getSemrushKeywordOverview(args.keyword, args.database);
    case 'get_semrush_competitors':
      return { competitors: await getSemrushCompetitors(args.domain, args.database, args.limit) };
    case 'get_bing_webmaster_data': {
      const kind = args.kind || 'rank_traffic';
      if (kind === 'query_stats') return getBingQueryStats(args.siteUrl);
      if (kind === 'crawl_stats') return getBingCrawlStats(args.siteUrl);
      if (kind === 'sites') return getBingSites();
      return getBingRankAndTrafficStats(args.siteUrl);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function POST(req) {
  if (!authCheck(req)) {
    return NextResponse.json({ jsonrpc:'2.0', error:{ code:-32000, message:'Unauthorized' }, id: null }, { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ jsonrpc:'2.0', error:{ code:-32700, message:'Parse error' }, id: null }, { status: 400 });
  }

  const { method, params, id } = body;

  try {
    let result;
    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: `${SITE}-mcp`, version: '1.1.0' }
        };
        break;
      case 'tools/list':
        result = { tools: TOOLS };
        break;
      case 'tools/call': {
        const { name, arguments: args } = params || {};
        const toolResult = await callTool(name, args || {});
        result = { content: [{ type: 'text', text: JSON.stringify(toolResult, null, 2) }] };
        break;
      }
      default:
        return NextResponse.json({ jsonrpc:'2.0', error:{ code:-32601, message:`Method not found: ${method}` }, id }, { status: 404 });
    }
    return NextResponse.json({ jsonrpc:'2.0', result, id });
  } catch (err) {
    return NextResponse.json({ jsonrpc:'2.0', error:{ code:-32000, message: err.message }, id });
  }
}

export async function GET(req) {
  if (!authCheck(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({
    name: `${SITE}-mcp`,
    version: '1.1.0',
    protocol: 'MCP Streamable HTTP (2024-11-05)',
    endpoint: `https://searchauditpro.com/api/mcp`,
    auth: 'Bearer <MCP_SECRET>',
    tools: TOOLS.map(t => ({ name: t.name, description: t.description }))
  });
}
