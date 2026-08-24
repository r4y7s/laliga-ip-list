#!/usr/bin/env node
'use strict';

const fs = require('fs');

const JSON_FILE        = process.env.JSON_FILE        || 'data.json';
const OUTPUT_JSON_FILE = process.env.OUTPUT_JSON_FILE || 'laliga_status.json';
const CF_IP_THRESHOLD  = Number(process.env.CLOUDFLARE_IP_THRESHOLD ?? 6);
const ISP_THRESHOLD    = Number(process.env.ISP_THRESHOLD ?? 2);
const CONFIRMATIONS    = Number(process.env.CONFIRMATIONS ?? 2);

// Igualdad exacta con "Cloudflare" dejaba fuera "Cloudflare R2",
// que sí se bloquea durante los partidos.
const CF_PATTERN = /^cloudflare/i;

/** El feed usa "YYYY-MM-DD HH:MM:SSZ": lo normalizamos a ISO-8601 real. */
function parseFeedDate(value) {
  if (typeof value !== 'string') return null;
  let t = value.trim().replace(' ', 'T');
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(t)) t += 'Z';   // el feed viene en UTC
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Último cambio por timestamp, sin asumir que el array venga ordenado. */
function currentlyBlocked(entry) {
  const changes = entry && entry.stateChanges;
  if (!Array.isArray(changes) || changes.length === 0) return false;
  let latest = null;
  let latestAt = -Infinity;
  for (const c of changes) {
    const parsed = parseFeedDate(c.timestamp);
    const at = parsed ? parsed.getTime() : -Infinity;
    if (at >= latestAt) { latestAt = at; latest = c; }
  }
  return latest ? latest.state === true : false;
}

function main() {
  const feed = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
  if (!Array.isArray(feed && feed.data)) {
    throw new Error('data.json no contiene un array "data"');
  }

  // Una entrada por par (ip, isp), así que el Set cuenta operadores.
  const ispsByIp = new Map();
  const cdnByIp  = new Map();

  for (const entry of feed.data) {
    if (!entry || !entry.ip) continue;
    if (!currentlyBlocked(entry)) continue;
    if (!ispsByIp.has(entry.ip)) ispsByIp.set(entry.ip, new Set());
    ispsByIp.get(entry.ip).add(entry.isp);
    if (entry.description) cdnByIp.set(entry.ip, entry.description);
  }

  const widelyBlocked = [...ispsByIp]
    .filter(([, isps]) => isps.size > ISP_THRESHOLD)
    .map(([ip]) => ip);

  const cloudflareBlocked = widelyBlocked
    .filter(ip => CF_PATTERN.test(cdnByIp.get(ip) || ''));

  const observed = cloudflareBlocked.length > CF_IP_THRESHOLD ? 'blocked' : 'unblocked';

  // ---- Estado previo e histéresis --------------------------------------
  let prev = {};
  try {
    prev = JSON.parse(fs.readFileSync(OUTPUT_JSON_FILE, 'utf-8'));
  } catch (err) {
    console.warn('⚠️ Sin estado previo legible, se parte de cero.');
  }

  let state        = prev.state != null ? prev.state : observed;
  let pending      = prev.pendingState != null ? prev.pendingState : null;
  let pendingHits  = prev.pendingCount != null ? prev.pendingCount : 0;
  let lastChangeAt = prev.lastChangeAt != null ? prev.lastChangeAt : null;

  const feedDate = parseFeedDate(feed.lastUpdate);
  const stamp = () => (feedDate || new Date()).toISOString();

  if (observed === state) {
    pending = null;
    pendingHits = 0;
  } else if (observed === pending) {
    pendingHits += 1;
    if (pendingHits >= CONFIRMATIONS) {
      state = observed;
      lastChangeAt = stamp();
      pending = null;
      pendingHits = 0;
    }
  } else {
    pending = observed;
    pendingHits = 1;
  }

  if (!lastChangeAt) lastChangeAt = stamp();

  const output = {
    lastChangeAt,
    lastChangeEpoch: Math.floor(new Date(lastChangeAt).getTime() / 1000),
    isBlocked: state === 'blocked',
    state,
    // diagnóstico y persistencia de la histéresis
    observedState: observed,
    cloudflareBlockedIps: cloudflareBlocked.length,
    widelyBlockedIps: widelyBlocked.length,
    feedLastUpdate: feedDate ? feedDate.toISOString() : null,
    pendingState: pending,
    pendingCount: pendingHits
  };

  fs.writeFileSync(OUTPUT_JSON_FILE, JSON.stringify(output, null, 2) + '\n');

  console.log(`🧠 IPs bloqueadas en >${ISP_THRESHOLD} ISPs: ${widelyBlocked.length}`);
  console.log(`☁️  De ellas Cloudflare: ${cloudflareBlocked.length} (umbral ${CF_IP_THRESHOLD})`);
  console.log(`📝 Observado: ${observed} → estado: ${state}` +
              (pending ? ` (pendiente ${pending}, ${pendingHits}/${CONFIRMATIONS})` : ''));
}

try {
  main();
} catch (err) {
  console.error('❌ Error en el análisis:', err.message);
  process.exit(1);
}
