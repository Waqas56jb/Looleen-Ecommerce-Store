/**
 * Polite HTTP client for public catalog collection.
 * - Obeys robots.txt (Disallow rules for our user agent or "*")
 * - One request at a time per host with a minimum delay between requests
 * - Retries with exponential backoff on 429 / 5xx / network errors
 * - Optional on-disk cache so re-runs don't hit the store again
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CACHE_DIR = path.join(ROOT, '.cache')

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 LOOKSPriceResearch/1.0'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ---------------- robots.txt ---------------- */

const robotsCache = new Map()

function parseRobots(txt) {
  // Collect Disallow/Allow rules for "*" (we don't claim a special bot name)
  const groups = []
  let current = null
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) continue
    const [k, ...rest] = line.split(':')
    const key = k.trim().toLowerCase()
    const val = rest.join(':').trim()
    if (key === 'user-agent') {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] }
        groups.push(current)
      }
      current.agents.push(val.toLowerCase())
    } else if ((key === 'disallow' || key === 'allow') && current) {
      current.rules.push({ allow: key === 'allow', path: val })
    }
  }
  // These collectors are operated with an Anthropic (Claude) AI assistant, so a site's
  // rules for Anthropic agents apply too — e.g. "User-agent: ClaudeBot / Disallow: /".
  // As in the robots.txt standard, the most specific matching group wins: if the site
  // has a group for Anthropic agents, only that group applies; otherwise the "*" group.
  const anthropic = groups.filter((g) => g.agents.some((a) => /claude|anthropic/.test(a)))
  const chosen = anthropic.length ? anthropic : groups.filter((g) => g.agents.includes('*'))
  return chosen.flatMap((g) => g.rules)
}

function ruleMatches(rulePath, urlPath) {
  if (!rulePath) return false
  const esc = rulePath.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  const re = new RegExp('^' + (esc.endsWith('\\$') ? esc.slice(0, -2) + '$' : esc))
  return re.test(urlPath)
}

/** true when robots.txt allows fetching this URL for "*" */
export async function robotsAllowed(url) {
  const u = new URL(url)
  if (!robotsCache.has(u.host)) {
    let rules = []
    try {
      const res = await fetch(`${u.protocol}//${u.host}/robots.txt`, { headers: { 'user-agent': USER_AGENT } })
      if (res.ok) rules = parseRobots(await res.text())
    } catch {
      rules = []
    }
    robotsCache.set(u.host, rules)
  }
  const rules = robotsCache.get(u.host)
  const p = u.pathname + u.search
  // Longest matching rule wins (Google semantics)
  let best = null
  for (const r of rules) if (ruleMatches(r.path, p) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r
  return !best || best.allow
}

/* ---------------- throttled fetch ---------------- */

const lastHit = new Map()

/**
 * fetch with politeness. opts: { delayMs=1200, retries=4, json=false, headers, method, body, cache=true, checkRobots=true }
 * Returns { ok, status, data, url } — never throws for HTTP errors.
 */
export async function politeFetch(url, opts = {}) {
  const { delayMs = 1200, retries = 4, json = false, headers = {}, method = 'GET', body, cache = true, checkRobots = true } = opts
  if (checkRobots && !(await robotsAllowed(url))) return { ok: false, status: 'robots-disallowed', data: null, url }

  const key = crypto.createHash('sha1').update(method + ' ' + url + ' ' + (body ?? '') + JSON.stringify(headers)).digest('hex')
  const cacheFile = path.join(CACHE_DIR, new URL(url).host, key.slice(0, 2), key + (json ? '.json' : '.txt'))
  if (cache && fs.existsSync(cacheFile)) {
    const raw = fs.readFileSync(cacheFile, 'utf8')
    return { ok: true, status: 200, data: json ? JSON.parse(raw) : raw, url, cached: true }
  }

  const host = new URL(url).host
  for (let attempt = 0; attempt <= retries; attempt++) {
    const wait = (lastHit.get(host) ?? 0) + delayMs - Date.now()
    if (wait > 0) await sleep(wait)
    lastHit.set(host, Date.now())
    try {
      const res = await fetch(url, {
        method,
        body,
        headers: { 'user-agent': USER_AGENT, accept: json ? 'application/json' : 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8', 'accept-language': 'en-US,en;q=0.9,ar;q=0.8', ...headers },
        redirect: 'follow',
      })
      if (res.status === 429 || res.status >= 500) {
        await sleep(Math.min(60_000, 2000 * 2 ** attempt))
        continue
      }
      const text = await res.text()
      if (!res.ok) return { ok: false, status: res.status, data: text.slice(0, 500), url }
      let data = text
      if (json) {
        try {
          data = JSON.parse(text)
        } catch {
          return { ok: false, status: 'invalid-json', data: text.slice(0, 500), url }
        }
      }
      if (cache) {
        fs.mkdirSync(path.dirname(cacheFile), { recursive: true })
        fs.writeFileSync(cacheFile, json ? JSON.stringify(data) : text)
      }
      return { ok: true, status: res.status, data, url }
    } catch (e) {
      if (attempt === retries) return { ok: false, status: 'network-error', data: String(e), url }
      await sleep(Math.min(60_000, 2000 * 2 ** attempt))
    }
  }
  return { ok: false, status: 'retries-exhausted', data: null, url }
}
