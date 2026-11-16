// 시연 HTML용 prisma: 브라우저 안에서만 도는 작은 DB. 실제 화면 코드(_data.ts·_actions.ts)가 쓰는 만큼만 흉내 낸다.
// 운영진 규칙(11/17): 팀 서버·외부 DB를 거치지 않는다 → 데이터는 이 브라우저(localStorage)에만 남고, 파일을 새로 열면 지운다(entry.tsx).
// 지원: findUnique·findFirst·findMany·count·create·createMany·update·updateMany·upsert·delete·deleteMany·$transaction,
// where(같음·null·not·in·notIn·gt·gte·lt·lte·contains·startsWith·OR·AND·NOT·관계 is·isNot·some·none·every), select·include·_count, orderBy, take·skip.
// shortcut: 위 목록 밖의 Prisma 기능은 없다. 쓰는 곳이 생기면 여기에 더한다(모르는 연산자는 오류로 알린다)

type Row = Record<string, unknown>;
type Rel = { model: string; many: boolean; from: string; to: string }; // from(이 표의 칸) = to(상대 표의 칸)

const uid = () => crypto.randomUUID();
const now = () => new Date();

// prisma/schema.prisma에서 옮김. 기본값이 함수면 만들 때마다 부른다
const MODELS: Record<string, { fields: Record<string, unknown>; rels: Record<string, Rel> }> = {
  caregiver: {
    fields: { id: uid, name: "", licenseNumber: null, kakaoId: null, isDemo: false, demoExpiresAt: null, consentedAt: null, consentItems: null },
    rels: {
      visits: { model: "visit", many: true, from: "id", to: "caregiverId" },
      clients: { model: "client", many: true, from: "id", to: "caregiverId" },
      aiUsages: { model: "aiUsage", many: true, from: "id", to: "caregiverId" },
    },
  },
  aiUsage: {
    fields: { id: uid, caregiverId: "", kind: "", createdAt: now },
    rels: { caregiver: { model: "caregiver", many: false, from: "caregiverId", to: "id" } },
  },
  client: {
    fields: {
      id: uid, name: "", age: null, gender: null, allergies: null, medicalHistory: null, medicationNotes: null, personalNotes: null,
      guardianName: "", guardianRelation: "기타", guardianPhone: null, careRegistrationNumber: null, careGrade: null, phone: null,
      scheduleLabel: null, isActive: true, purgeAt: null, deletedAt: null, caregiverId: null, boardToken: null, boardExpiresAt: null,
    },
    rels: {
      caregiver: { model: "caregiver", many: false, from: "caregiverId", to: "id" },
      visits: { model: "visit", many: true, from: "id", to: "clientId" },
      documents: { model: "sharedDocument", many: true, from: "id", to: "clientId" },
    },
  },
  visit: {
    fields: { id: uid, caregiverId: "", clientId: "", startedAt: null, endedAt: null, status: "NOT_STARTED", transcript: null, createdAt: now },
    rels: {
      caregiver: { model: "caregiver", many: false, from: "caregiverId", to: "id" },
      client: { model: "client", many: false, from: "clientId", to: "id" },
      report: { model: "report", many: false, from: "id", to: "visitId" },
    },
  },
  report: {
    fields: {
      id: uid, visitId: "", meals: "", medication: "", notes: "", medicationMorning: false, medicationLunch: false, medicationEvening: false,
      medicationBedtime: false, medicationNone: false, aiRawJson: null, careRecord: null, signatures: null, wasEdited: false, shareToken: uid,
      sentAt: null, viewedAt: null, viewCount: 0,
    },
    rels: {
      visit: { model: "visit", many: false, from: "visitId", to: "id" },
      comments: { model: "comment", many: true, from: "id", to: "reportId" },
    },
  },
  comment: {
    fields: { id: uid, reportId: null, documentId: null, author: "", body: "", createdAt: now, readAt: null },
    rels: {
      report: { model: "report", many: false, from: "reportId", to: "id" },
      document: { model: "sharedDocument", many: false, from: "documentId", to: "id" },
    },
  },
  sharedDocument: {
    fields: { id: uid, shareToken: uid, clientId: "", caregiverId: "", kind: "", from: "", to: "", createdAt: now },
    rels: {
      client: { model: "client", many: false, from: "clientId", to: "id" },
      comments: { model: "comment", many: true, from: "id", to: "documentId" },
    },
  },
};

// 저장: 날짜는 {"$d": ISO}로 바꿔 둔다
const KEY = "sondaeum-demo-db";
const revive = (_k: string, v: unknown) => (v && typeof v === "object" && "$d" in (v as Row) ? new Date((v as { $d: string }).$d) : v);
function load(): Record<string, Row[]> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw, revive);
  } catch {}
  return Object.fromEntries(Object.keys(MODELS).map((m) => [m, []]));
}
let db = load();
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db, function (k, v) {
      const raw = (this as Row)[k];
      return raw instanceof Date ? { $d: raw.toISOString() } : v;
    }));
  } catch {}
}
export function resetDb() {
  db = Object.fromEntries(Object.keys(MODELS).map((m) => [m, []]));
  save();
}

const cmp = (a: unknown, b: unknown) => {
  const x = a instanceof Date ? a.getTime() : a;
  const y = b instanceof Date ? b.getTime() : b;
  return x === y ? 0 : (x as number) < (y as number) ? -1 : 1;
};
const same = (a: unknown, b: unknown) => (a ?? null) === (b ?? null) || (a instanceof Date && b instanceof Date && a.getTime() === b.getTime());

function related(model: string, row: Row, rel: Rel): Row[] {
  return db[rel.model].filter((r) => row[rel.from] !== null && row[rel.from] !== undefined && same(r[rel.to], row[rel.from]));
}

function matchScalar(v: unknown, cond: unknown): boolean {
  if (cond === null || typeof cond !== "object" || cond instanceof Date) return same(v, cond);
  for (const [op, arg] of Object.entries(cond as Row)) {
    if (arg === undefined) continue;
    const ok =
      op === "equals" ? same(v, arg)
      : op === "not" ? !matchScalar(v, arg)
      : op === "in" ? (arg as unknown[]).some((a) => same(v, a))
      : op === "notIn" ? !(arg as unknown[]).some((a) => same(v, a))
      : op === "gt" ? v !== null && v !== undefined && cmp(v, arg) > 0
      : op === "gte" ? v !== null && v !== undefined && cmp(v, arg) >= 0
      : op === "lt" ? v !== null && v !== undefined && cmp(v, arg) < 0
      : op === "lte" ? v !== null && v !== undefined && cmp(v, arg) <= 0
      : op === "contains" ? typeof v === "string" && v.includes(arg as string)
      : op === "startsWith" ? typeof v === "string" && v.startsWith(arg as string)
      : (() => { throw new Error(`시연 DB: 모르는 조건 ${op}`); })();
    if (!ok) return false;
  }
  return true;
}

function match(model: string, row: Row, where: Row | undefined): boolean {
  if (!where) return true;
  const { rels } = MODELS[model];
  for (const [k, cond] of Object.entries(where)) {
    if (cond === undefined) continue;
    if (k === "OR") { if (!(cond as Row[]).some((w) => match(model, row, w))) return false; continue; }
    if (k === "AND") { if (![cond].flat().every((w) => match(model, row, w as Row))) return false; continue; }
    if (k === "NOT") { if ([cond].flat().some((w) => match(model, row, w as Row))) return false; continue; }
    const rel = rels[k];
    if (!rel) { if (!matchScalar(row[k], cond)) return false; continue; }
    const rs = related(model, row, rel);
    if (rel.many) {
      const c = cond as Row;
      if (c.some && !rs.some((r) => match(rel.model, r, c.some as Row))) return false;
      if (c.none && rs.some((r) => match(rel.model, r, c.none as Row))) return false;
      if (c.every && !rs.every((r) => match(rel.model, r, c.every as Row))) return false;
      continue;
    }
    const one = rs[0];
    if (cond === null) { if (one) return false; continue; }
    const c = cond as Row;
    if ("isNot" in c) { if (c.isNot === null ? !one : one && match(rel.model, one, c.isNot as Row)) return false; continue; }
    const w = ("is" in c ? c.is : c) as Row | null;
    if (w === null) { if (one) return false; continue; }
    if (!one || !match(rel.model, one, w)) return false;
  }
  return true;
}

function order(rows: Row[], orderBy: unknown) {
  const keys = [orderBy].flat().filter(Boolean).flatMap((o) => Object.entries(o as Row)) as [string, string][];
  if (!keys.length) return rows;
  return [...rows].sort((a, b) => {
    for (const [k, dir] of keys) {
      const c = cmp(a[k] ?? -Infinity, b[k] ?? -Infinity);
      if (c) return dir === "desc" ? -c : c;
    }
    return 0;
  });
}

type Args = { where?: Row; select?: Row; include?: Row; orderBy?: unknown; take?: number; skip?: number; data?: Row | Row[]; create?: Row; update?: Row };

function project(model: string, row: Row, args: Args): Row {
  const { rels } = MODELS[model];
  const out: Row = {};
  const pick = args.select;
  if (!pick) for (const f of Object.keys(MODELS[model].fields)) out[f] = row[f];
  const relSpec = pick ?? args.include ?? {};
  for (const [k, spec] of Object.entries(pick ?? {})) {
    if (spec && !rels[k] && k !== "_count") out[k] = row[k];
  }
  for (const [k, spec] of Object.entries(relSpec)) {
    if (!spec) continue;
    if (k === "_count") {
      const sel = ((spec as Row).select ?? {}) as Row;
      out._count = Object.fromEntries(Object.keys(sel).map((r) => [r, related(model, row, rels[r]).length]));
      continue;
    }
    const rel = rels[k];
    if (!rel) continue;
    const sub = (spec === true ? {} : spec) as Args;
    let rs = related(model, row, rel).filter((r) => match(rel.model, r, sub.where));
    if (rel.many) {
      rs = order(rs, sub.orderBy).slice(sub.skip ?? 0, sub.take === undefined ? undefined : (sub.skip ?? 0) + sub.take);
      out[k] = rs.map((r) => project(rel.model, r, sub));
    } else out[k] = rs[0] ? project(rel.model, rs[0], sub) : null;
  }
  return out;
}

function applyData(model: string, row: Row, data: Row) {
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (MODELS[model].rels[k]) throw new Error(`시연 DB: 관계 쓰기(${model}.${k})는 없다`);
    if (v && typeof v === "object" && !(v instanceof Date)) {
      const o = v as Row;
      if ("increment" in o) row[k] = ((row[k] as number) ?? 0) + (o.increment as number);
      else if ("decrement" in o) row[k] = ((row[k] as number) ?? 0) - (o.decrement as number);
      else if ("set" in o) row[k] = o.set;
      else row[k] = v;
    } else row[k] = v;
  }
}

function makeRow(model: string, data: Row): Row {
  const row: Row = {};
  for (const [f, d] of Object.entries(MODELS[model].fields)) row[f] = typeof d === "function" ? (d as () => unknown)() : d;
  applyData(model, row, data);
  return row;
}

function table(model: string) {
  const rows = () => db[model];
  const find = (a: Args) => order(rows().filter((r) => match(model, r, a.where)), a.orderBy);
  const one = (a: Args) => {
    const r = find(a)[0];
    return r ? project(model, r, a) : null;
  };
  const mustOne = (a: Args) => {
    const r = find(a)[0];
    if (!r) throw new Error(`시연 DB: ${model}을(를) 찾지 못했어요`);
    return r;
  };
  return {
    findUnique: async (a: Args) => one(a),
    findUniqueOrThrow: async (a: Args) => project(model, mustOne(a), a),
    findFirst: async (a: Args = {}) => one(a),
    findFirstOrThrow: async (a: Args = {}) => project(model, mustOne(a), a),
    findMany: async (a: Args = {}) => {
      const rs = find(a);
      return rs.slice(a.skip ?? 0, a.take === undefined ? undefined : (a.skip ?? 0) + a.take).map((r) => project(model, r, a));
    },
    count: async (a: Args = {}) => find(a).length,
    create: async (a: Args) => {
      const r = makeRow(model, a.data as Row);
      rows().push(r);
      save();
      return project(model, r, a);
    },
    createMany: async (a: Args) => {
      for (const d of [a.data].flat() as Row[]) rows().push(makeRow(model, d));
      save();
      return { count: [a.data].flat().length };
    },
    update: async (a: Args) => {
      const r = mustOne(a);
      applyData(model, r, a.data as Row);
      save();
      return project(model, r, a);
    },
    updateMany: async (a: Args) => {
      const rs = find(a);
      rs.forEach((r) => applyData(model, r, a.data as Row));
      save();
      return { count: rs.length };
    },
    upsert: async (a: Args) => {
      const r = find(a)[0];
      if (r) applyData(model, r, a.update as Row);
      else rows().push(makeRow(model, { ...(a.create as Row) }));
      save();
      return project(model, r ?? rows()[rows().length - 1], a);
    },
    delete: async (a: Args) => {
      const r = mustOne(a);
      db[model] = rows().filter((x) => x !== r);
      save();
      return project(model, r, a);
    },
    deleteMany: async (a: Args = {}) => {
      const before = rows().length;
      db[model] = rows().filter((r) => !match(model, r, a.where));
      save();
      return { count: before - db[model].length };
    },
  };
}

export const prisma = {
  ...Object.fromEntries(Object.keys(MODELS).map((m) => [m, table(m)])),
  // 배열이면 차례로 기다린다. 함수면 같은 prisma를 넘긴다(되돌리기는 없다)
  $transaction: async (arg: unknown) => (typeof arg === "function" ? arg(prisma) : Promise.all(arg as Promise<unknown>[])),
} as unknown as typeof import("@/lib/prisma").prisma;
