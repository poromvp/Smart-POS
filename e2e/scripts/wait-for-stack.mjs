const TARGETS = [
  { name: "auth-service", url: "http://localhost:8081/actuator/health" },
  { name: "catalog-inventory-service", url: "http://localhost:8082/actuator/health" },
  { name: "sales-service", url: "http://localhost:8083/actuator/health" },
  { name: "api-gateway", url: "http://localhost:8088/actuator/health" },
  { name: "frontend", url: "http://localhost:3000/login" },
];

const timeoutMs = Number(process.env.STACK_WAIT_TIMEOUT_MS || 120_000);
const start = Date.now();

async function isHealthy(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const pending = new Map(TARGETS.map((t) => [t.name, t.url]));

  while (pending.size > 0) {
    for (const [name, url] of Array.from(pending.entries())) {
      if (await isHealthy(url)) {
        console.log(`[READY] ${name} (${url})`);
        pending.delete(name);
      }
    }
    if (pending.size === 0) {
      console.log("[ALL SERVICES READY]");
      return;
    }
    if (Date.now() - start > timeoutMs) {
      const remaining = Array.from(pending.entries())
        .map(([n, u]) => `${n} (${u})`)
        .join(", ");
      console.error(`[TIMEOUT] Waiting for services timed out after ${timeoutMs}ms: ${remaining}`);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

main();
