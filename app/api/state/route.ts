// Хранение общего состояния группы в Upstash Redis (Vercel KV) через REST.
// Не требует npm-зависимостей. Если переменные окружения не заданы — отвечает 501,
// и приложение продолжает работать на localStorage + экспорт/импорт файла.

export const dynamic = "force-dynamic";

const key = (code: string) => `samgmu:${code}`;

function creds() {
    const url =
        process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
    const token =
        process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
    return url && token ? { url, token } : null;
}

async function redis(cmd: string[]) {
    const cr = creds();
    if (!cr) return null;
    const res = await fetch(cr.url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${cr.token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(cmd),
        cache: "no-store",
    });
    return res.json();
}

export async function GET(req: Request) {
    if (!creds())
        return Response.json({ error: "not_configured" }, { status: 501 });
    const code = new URL(req.url).searchParams.get("code");
    if (!code) return Response.json({ error: "no_code" }, { status: 400 });
    try {
        const out = await redis(["GET", key(code)]);
        const raw = out?.result;
        return Response.json({ state: raw ? JSON.parse(raw) : null });
    } catch {
        return Response.json({ error: "read_failed" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    if (!creds())
        return Response.json({ error: "not_configured" }, { status: 501 });
    try {
        const body = await req.json();
        const code = body?.code;
        if (!code) return Response.json({ error: "no_code" }, { status: 400 });
        await redis(["SET", key(code), JSON.stringify(body.state ?? null)]);
        return Response.json({ ok: true });
    } catch {
        return Response.json({ error: "write_failed" }, { status: 500 });
    }
}