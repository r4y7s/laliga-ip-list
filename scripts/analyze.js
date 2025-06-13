const fs = require('fs');

(async () => {
  try {
    const jsonFile = process.env.JSON_FILE || 'data.json';
    const cloudflareIpThreshold = process.env.CLOUDFLARE_IP_THRESHOLD || 6;
    const raw = fs.readFileSync(jsonFile, 'utf-8');
    const a = JSON.parse(raw);

    let s = 0, n = 0;
    if (a && a.data) {
      const e = new Map(), t = new Map();
      a.data.forEach(a => {
        if (a.stateChanges && a.stateChanges.length > 0) {
          const last = a.stateChanges[a.stateChanges.length - 1];
          if (last.state === true) {
            const count = e.get(a.ip) || 0;
            e.set(a.ip, count + 1);
            if (a.description === "Cloudflare") {
              const cfCount = t.get(a.ip) || 0;
              t.set(a.ip, cfCount + 1);
            }
          }
        }
      });
      // Contar IPs con más de 2 bloqueos generales
      s = Array.from(e.values()).filter(e => e > 2).length;
      // Contar IPs con más de 2 bloqueos en Cloudflare
      n = Array.from(t.values()).filter(e => e > 2).length;
    }

    // Determinar si está bloqueado: si hay más de X IPs (de Cloudflare) que están bloqueadas en más de 2 ISPs
    const isBlocked = n > cloudflareIpThreshold;
    const state = isBlocked ? "blocked" : "unblocked";
    let lastChangeAt = a.lastUpdate || new Date().toISOString().replace("T", " ").substring(0, 19);

    const outputFile = process.env.OUTPUT_JSON_FILE || 'laliga_status.json';

    if (fs.existsSync(outputFile)) {
      try {
        const prev = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
        if (prev.state === state && prev.lastChangeAt) {
          lastChangeAt = prev.lastChangeAt;
        }
      } catch (err) {
        console.warn("⚠️ Could not read previous status, using current time.");
      }
    }
    let lastChangeEpoch = Math.floor(new Date(lastChangeAt).getTime() / 1000);

    const output = {
      lastChangeAt: lastChangeAt,
      lastChangeEpoch: lastChangeEpoch,
      isBlocked,
      state
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

    console.log(`🧠 Analyzed: ${n} Cloudflare IPs > ${cloudflareIpThreshold}`);
    console.log(`📝 Status: ${state}`);

    // Cleanup
    try {
      if (fs.existsSync(jsonFile)) {
        fs.unlinkSync(jsonFile);
        console.log(`🗑️ Removed temporary file: ${jsonFile}`);
      }
    } catch (cleanupErr) {
      console.warn("⚠️ Failed to remove temporary JSON file:", cleanupErr.message);
    }

  } catch (err) {
    console.error("❌ Error in JavaScript analysis:", err);
    process.exit(1);
  }
})();
