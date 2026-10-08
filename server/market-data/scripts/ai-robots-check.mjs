// Check each store's robots.txt for groups that target Anthropic/AI agents and what they disallow.
const hosts = { looieen: 'looieen.com', salla_api: 'api.salla.dev', goldenscent: 'www.goldenscent.com', niceone: 'niceonesa.com', whites: 'www.whites.sa', nahdi: 'www.nahdionline.com', nahdi_algolia: 'h9x4ih7m99-dsn.algolia.net', watsons: 'www.watsons.sa', faces: 'www.faces.sa', faces_cnstrc: 'ac.cnstrc.com', beautyselect: 'beautyselect.sa', cosmeticssa: 'cosmetics.sa', kohlalward: 'kohlalward.com' }
const AI = /claude|anthropic|gptbot|chatgpt|ccbot|google-extended|perplexity|ai2bot|bytespider|omgili|cohere/i
for (const [id, host] of Object.entries(hosts)) {
  let txt = ''
  try { const r = await fetch(`https://${host}/robots.txt`, { headers: { 'user-agent': 'Mozilla/5.0 Chrome/129.0' } }); txt = r.ok ? await r.text() : `HTTP ${r.status}` } catch (e) { txt = 'ERR ' + e.message }
  const groups = []; let cur = null
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim(); if (!line) continue
    const [k, ...v] = line.split(':'); const key = k.trim().toLowerCase(); const val = v.join(':').trim()
    if (key === 'user-agent') { if (!cur || cur.rules.length) { cur = { agents: [], rules: [] }; groups.push(cur) } cur.agents.push(val) }
    else if (cur && (key === 'disallow' || key === 'allow')) cur.rules.push(`${key}:${val}`)
  }
  const aiGroups = groups.filter((g) => g.agents.some((a) => AI.test(a)))
  const claude = aiGroups.filter((g) => g.agents.some((a) => /claude|anthropic/i.test(a)))
  console.log(id.padEnd(14), txt.startsWith('HTTP') || txt.startsWith('ERR') ? txt : `AI groups: ${aiGroups.length}; Anthropic-targeted: ${claude.map((g) => g.agents.join(',') + ' => ' + g.rules.slice(0, 3).join(' ')).join(' || ') || 'none'}`)
}
