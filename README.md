# 🛡️ laliga-ip-list

## 🇪🇸 Descripción

Este repositorio mantiene una lista blanca de **IPs legítimas** afectadas por los
**bloqueos judiciales impuestos en España por LaLiga** como parte de su lucha
contra la piratería, según los datos públicos de
[hayahora.futbol](https://hayahora.futbol/).

### 📄 ¿Qué contiene?

**`laliga_ip_list.txt`** — histórico **acumulado** de IPs legítimas que han sido
bloqueadas de forma colateral en algún momento durante las retransmisiones de
partidos en España, afectando servicios como:

- RAE (Real Academia Española)
- Universidades y centros de investigación
- Medios de comunicación
- Sitios de patrocinadores y clubes

> ⚠️ Es un acumulado histórico, **no** la lista de lo que está bloqueado en este
> instante. Una IP permanece en el fichero aunque el bloqueo ya se haya
> levantado. Para el estado en tiempo real, consulta directamente
> [blocked-any.txt](https://hayahora.futbol/estado/blocked-any.txt) y los
> ficheros por operador en el origen.

**`laliga_status.json`** — indica si hay un bloqueo activo en curso:

```json
{
  "lastChangeAt": "2026-08-23T21:32:28.000Z",
  "lastChangeEpoch": 1787520748,
  "isBlocked": false,
  "state": "unblocked"
}
```

Se considera que hay bloqueo cuando más de `CLOUDFLARE_IP_THRESHOLD` IPs de
Cloudflare están bloqueadas simultáneamente en más de dos operadores. El estado
requiere varias lecturas consecutivas para cambiar, de modo que las
fluctuaciones puntuales de las sondas no lo hagan oscilar. El fichero incluye
además campos de diagnóstico (`observedState`, `cloudflareBlockedIps`,
`widelyBlockedIps`, `feedLastUpdate`).

### 🔄 Actualización automática

Ambos ficheros se regeneran automáticamente cuando cambian los datos de origen.

### ⚡ ¿Cómo usarlo?

- Lista de IPs: `https://raw.githubusercontent.com/r4y7s/laliga-ip-list/main/laliga_ip_list.txt`
- Estado: `https://raw.githubusercontent.com/r4y7s/laliga-ip-list/main/laliga_status.json`

Puedes usarlo en firewalls, proxies, bloqueadores DNS o cualquier sistema que
permita gestionar reglas de lista blanca / lista negra.

### 🙏 Créditos

Los datos proceden de [hayahora.futbol](https://hayahora.futbol/). Este
repositorio solo los reempaqueta; todo el mérito de las sondas y la
monitorización es suyo.

---

## 🇬🇧 Description

This repository maintains a whitelist of **legitimate IPs** that have been
unintentionally affected by **judicial IP blocks in Spain ordered by LaLiga** as
part of its anti-piracy efforts, based on public data from
[hayahora.futbol](https://hayahora.futbol/).

### 📄 What's inside?

**`laliga_ip_list.txt`** — a **cumulative** history of legitimate IPs that were
wrongly blocked at some point during football match streams in Spain, affecting
services like:

- RAE (Royal Spanish Academy)
- Universities and research centers
- News outlets
- Sponsor and club websites

> ⚠️ This is a cumulative history, **not** a list of what is blocked right now.
> An IP stays in the file even after the block is lifted. For real-time state,
> use [blocked-any.txt](https://hayahora.futbol/estado/blocked-any.txt) and the
> per-ISP files at the source.

**`laliga_status.json`** — whether a block is currently active. A block is
considered active when more than `CLOUDFLARE_IP_THRESHOLD` Cloudflare IPs are
blocked simultaneously across more than two ISPs. The state requires several
consecutive readings before it flips, so transient probe noise doesn't make it
oscillate.

### 🔄 Automatic updates

Both files are regenerated automatically whenever the upstream data changes.

### ⚡ How to use

- IP list: `https://raw.githubusercontent.com/r4y7s/laliga-ip-list/main/laliga_ip_list.txt`
- Status: `https://raw.githubusercontent.com/r4y7s/laliga-ip-list/main/laliga_status.json`

You can use it in firewalls, proxies, DNS blockers, or any system that supports
whitelist/blacklist rule management.

### 🙏 Credits

Data comes from [hayahora.futbol](https://hayahora.futbol/). This repository
just repackages it; all credit for the probes and monitoring is theirs.
