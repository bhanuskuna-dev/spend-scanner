import { useState, useEffect } from "react";

const RAPIDAPI_KEY = "f9dbe49851msh7ded57f6efdd6c5p1f8bacjsn103fb81f6671";
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

// ── VERIFIED BULLET BANK ──────────────────────────────────────────────────────
const BULLET_BANK = {
  amex_director: {
    role: "Director of Product Management – Customer Management Products",
    company: "American Express", location: "New York, NY", dates: "Mar 2024 – Present",
    bullets: [
      "Owned end-to-end product vision and execution for Customer Management credit lifecycle products spanning credit decisioning, retention, recovery, and servicing for a $12B+ card member portfolio.",
      "Built an agentic orchestration system on ChatGPT leveraging sub-agents and skills to fully automate the requirements lifecycle from discovery through feature definition and end-to-end scenario documentation. Integrated HITL validation checkpoints throughout, delivering 25% efficiency gains across the team.",
      "Orchestrated 0 to 1 Retention and Recovery Lifecycle Management program, driving $12M PTI through real-time credit lifecycle decisioning for high-value customer segments.",
      "Steered strategic migration to GCP-based risk engines and API-first orchestration, ensuring technical scalability and multi-market enterprise value.",
      "Delivered $10M PTI via customer servicing transformation and $8M PTI through mobile credit journey optimization for premium segments, aligning backend orchestration with front-end UX.",
      "Reengineered Reg B workflows for audit readiness and delivered GTM readiness for recovery framing and documentation. Earned Business Excellence Award (Top 2%).",
      "Lead a high-performing organization of 7 PMs and analysts in a player-coach model, serving as primary architect for the department's AI and data strategy.",
    ]
  },
  amex_governance: {
    role: "Senior Product Manager – Risk Governance & Model Quality",
    company: "American Express", location: "New York, NY", dates: "Oct 2022 – Mar 2024",
    bullets: [
      "Defined product strategy for AiDA Govern platform, enabling secure lifecycle oversight for 300+ production AI models including credit underwriting and risk decisioning systems, with policy controls aligned to SR 11-7.",
      "Embedded audit transparency and lifecycle oversight controls across ML model pipeline. Partnered with data science and compliance to scale governance globally.",
      "Built quantitative storytelling frameworks and dashboards enabling senior leaders to make model-level risk decisions with confidence.",
    ]
  },
  amex_regulatory: {
    role: "Senior Manager – Regulatory Enablement & Operational Risk",
    company: "American Express", location: "New York, NY", dates: "Jul 2019 – Oct 2022",
    bullets: [
      "Earned CFR Business Excellence Award for driving exam readiness and implementing 25+ risk mitigations across credit products spanning underwriting, loss management, and adverse action workflows.",
      "Streamlined adverse action templates by 90% and launched real-time remediation tracking system, earning SVP Star Award for operational efficiency.",
      "Translated Reg B/FACTA regulatory requirements into scalable product controls across credit lifecycle products.",
    ]
  },
  amex_credit: {
    role: "Product Manager – Global Credit Strategy Platforms",
    company: "American Express", location: "New York, NY", dates: "Jul 2016 – Jul 2019",
    bullets: [
      "Architected backend globalized APIs that reduced Proactive Line Increase rollout time by 50%, generating $20M+ PTI.",
      "Integrated ML-based credit strategy into existing customer credit limit optimization, delivering $20M PTI by improving underwriting precision through model-informed decisioning.",
    ]
  },
  capital_one: {
    role: "Product Owner – Commercial Risk Platforms",
    company: "Capital One", location: "New York, NY", dates: "Oct 2012 – Jul 2016",
    bullets: [
      "Managed product lifecycle for 17 PD (Probability of Default) and 17 LGD (Loss Given Default) models across underwriting and risk rating platforms.",
      "Reduced model deployment time by 50% while maintaining SOX-compliant controls, balancing speed with regulatory rigor in a SAFe environment.",
    ]
  }
};

const PROFILE = {
  name: "Bhanu Kuna",
  email: "bhanu.s.kuna@gmail.com",
  contact: "New York, NY | Raleigh, NC (Relocating) | 201-757-6373 | bhanu.s.kuna@gmail.com",
  headline: "Director of Product Management | AI Transformation | Credit Risk & Regulatory Platforms",
  summary: "Senior product leader with 17 years driving credit decisioning, risk governance, and AI transformation at American Express and Capital One. Expert at translating complex underwriting logic, loss management, and regulatory requirements into scalable platform products that deliver measurable business impact. Two-time Business Excellence Award winner (Top 2%) with a track record of leading PM organizations, shaping ML-driven decisioning systems, and building API-first risk platforms.",
  education: "Bachelor of Science in Finance — Boston College, 2009",
  certifications: "AI Product Management (Duke University) | SAFe 4 Certified PO/PM | Azure Fundamentals AZ-900 | Leadership Excellence (Harvard/Amex)",
  skills: {
    ai: "Prompt Engineering, Generative AI Workflows (OpenAI/Claude), Agentic Orchestration, ML Model Governance, HITL Frameworks",
    platform: "API Roadmap Design, GCP, Microservices, YAML, Gherkin, SQL, Rally",
    risk: "Credit Lifecycle Management, PD/LGD Model Governance, Reg B, FACTA, SR 11-7, GRC Platforms"
  }
};

const TARGET_COMPANIES = [
  { name: "Plaid", platform: "lever", slug: "plaid" },
  { name: "Circle", platform: "greenhouse", slug: "circle" },
  { name: "Marqeta", platform: "greenhouse", slug: "marqeta" },
  { name: "Affirm", platform: "greenhouse", slug: "affirm" },
  { name: "Stripe", platform: "greenhouse", slug: "stripe" },
  { name: "Chime", platform: "greenhouse", slug: "chime" },
  { name: "LendingClub", platform: "greenhouse", slug: "lendingclub" },
  { name: "Robinhood", platform: "greenhouse", slug: "robinhood" },
  { name: "NetApp", platform: "greenhouse", slug: "netapp" },
  { name: "Pendo", platform: "greenhouse", slug: "pendo" },
  { name: "Bandwidth", platform: "greenhouse", slug: "bandwidth" },
  { name: "Red Hat", platform: "greenhouse", slug: "red-hat" },
  { name: "Motive", platform: "greenhouse", slug: "motive" },
  { name: "Bayada", platform: "greenhouse", slug: "bayada" },
];

const JSEARCH_QUERIES = [
  "principal product manager fintech remote",
  "staff product manager credit risk AI remote",
  "director product management AI financial services remote",
  "group product manager fintech remote",
  "senior director product management financial services remote",
  "product manager AI fintech Raleigh NC",
  "director product management Raleigh North Carolina",
  "principal product manager Research Triangle Park NC",
  "senior product manager financial services Raleigh Durham",
  "head of AI products financial services remote",
  "director AI product management remote",
  "principal AI product manager remote",
  "VP AI products fintech remote",
  "head responsible AI product remote",
  "director AI transformation financial services remote",
  "AI product lead fintech remote",
  "head of AI strategy financial services remote",
  "VP digital transformation fintech remote",
  "principal AI program manager financial services remote",
  "director AI governance fintech remote",
  "head of risk technology fintech remote",
  "chief of staff AI technology fintech remote",
  "product manager Capital One",
  "product manager Truist Bank remote OR Raleigh",
  "product manager EY financial services remote",
  "product manager First Citizens Bank remote OR Raleigh",
];

const INDEED_RSS_FEEDS = [
  "https://www.indeed.com/rss?q=principal+product+manager+fintech&l=remote&sort=date",
  "https://www.indeed.com/rss?q=director+product+management+AI+financial&l=remote&sort=date",
  "https://www.indeed.com/rss?q=staff+product+manager+credit+risk&l=remote&sort=date",
  "https://www.indeed.com/rss?q=head+AI+strategy+fintech&l=remote&sort=date",
  "https://www.indeed.com/rss?q=product+manager+AI+fintech&l=Raleigh%2C+NC&sort=date",
  "https://www.indeed.com/rss?q=director+AI+product+management&l=remote&sort=date",
  "https://www.indeed.com/rss?q=VP+AI+products+financial+services&l=remote&sort=date",
  "https://www.indeed.com/rss?q=product+manager&l=Raleigh%2C+NC&sort=date&q=Capital+One+OR+Truist+OR+First+Citizens",
];

async function load(key) {
  try {
    const r = localStorage.getItem(key);
    return r ? JSON.parse(r) : null;
  } catch { return null; }
}
async function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

async function searchJSearch(query) {
  try {
    const url = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(query)}&num_pages=1&country=us&date_posted=week&job_requirements=no_degree`;
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY,
        "Content-Type": "application/json"
      }
    });
    const data = await res.json();
    return (data.data || []).map(j => ({
      id: j.job_id,
      title: j.job_title,
      company: j.employer_name,
      location: j.job_is_remote ? "Remote" : `${j.job_city || ""}, ${j.job_state || ""}`.trim().replace(/^,|,$/, ""),
      salary: j.job_min_salary ? `$${Math.round(j.job_min_salary / 1000)}K${j.job_max_salary ? `–$${Math.round(j.job_max_salary / 1000)}K` : "+"}` : null,
      url: j.job_apply_link,
      posted: j.job_posted_at_datetime_utc,
      description: j.job_description?.substring(0, 800),
      source: "JSearch",
      status: "new",
      saved: false,
    }));
  } catch { return []; }
}

async function searchGreenhouse(company) {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs?content=false`);
    const data = await res.json();
    const keywords = ["product", "ai", "risk", "strategy", "platform", "director", "principal", "staff", "group"];
    return (data.jobs || [])
      .filter(j => keywords.some(k => j.title?.toLowerCase().includes(k)))
      .map(j => ({
        id: `gh-${j.id}`,
        title: j.title,
        company: company.name,
        location: j.location?.name || "See listing",
        url: j.absolute_url,
        posted: j.updated_at,
        source: "Greenhouse",
        status: "new",
        saved: false,
      }));
  } catch { return []; }
}

async function searchLever(company) {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${company.slug}?mode=json`);
    const data = await res.json();
    const keywords = ["product", "ai", "risk", "strategy", "platform", "director", "principal", "staff", "group"];
    return data
      .filter(j => keywords.some(k => j.text?.toLowerCase().includes(k)))
      .map(j => ({
        id: `lv-${j.id}`,
        title: j.text,
        company: company.name,
        location: j.categories?.location || j.categories?.allLocations?.join(", ") || "See listing",
        url: j.hostedUrl,
        posted: new Date(j.createdAt).toISOString(),
        source: "Lever",
        status: "new",
        saved: false,
      }));
  } catch { return []; }
}

async function fetchIndeedRSS(url) {
  try {
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    const data = await res.json();
    return (data.items || []).map(item => ({
      id: `rss-${btoa(item.link).substring(0, 20)}`,
      title: item.title,
      company: item.author || "See listing",
      location: "See listing",
      url: item.link,
      posted: item.pubDate,
      description: item.description?.replace(/<[^>]+>/g, "").substring(0, 500),
      source: "Indeed RSS",
      status: "new",
      saved: false,
    }));
  } catch { return []; }
}

async function callAnthropic(body) {
  if (!ANTHROPIC_API_KEY) throw new Error("No Anthropic API key configured");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function scoreJob(job) {
  try {
    const prompt = `You are a job fit analyzer. Given this job listing and candidate profile, return ONLY a JSON object with no preamble.\n\nCANDIDATE: Bhanu Kuna — 17 years in product management, credit risk, AI governance, regulatory compliance (Reg B, FACTA, SR 11-7), API-first platforms, GCP, ML model governance (300+ models), agentic AI orchestration, team leadership (7 PMs). Currently Director of PM at American Express. Target: $200K+ TC, remote or Raleigh NC or NYC hybrid. Open to AI product roles, fintech, financial services, and enterprise tech.\n\nJOB:\nTitle: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\n${job.description ? `Description: ${job.description}` : ""}\n${job.salary ? `Salary: ${job.salary}` : ""}\n\nReturn this JSON:\n{\n  "fitScore": 0-100,\n  "relevant": true or false,\n  "reason": "one sentence why or why not",\n  "salaryOk": true or false or null\n}\n\nMark relevant=false if: entry level, requires hands-on crypto/Web3 depth, requires software engineering/coding skills, insurance underwriting (not tech PM), clearly below $150K, or outside US.\nMark relevant=true for: any PM or product leadership role in fintech, AI, financial services, credit risk, governance, compliance, or digital transformation. Also mark true for non-PM titles like Head of AI Strategy, VP Digital Transformation, Director AI Governance if they pay $200K+.`;

    const data = await callAnthropic({ model: ANTHROPIC_MODEL, max_tokens: 200, messages: [{ role: "user", content: prompt }] });
    const text = data.content?.find(b => b.type === "text")?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch { return { fitScore: 50, relevant: true, reason: "Could not score", salaryOk: null }; }
}

async function tailorResume(jd, jobTitle, company) {
  const bulletBankText = Object.values(BULLET_BANK).map(role =>
    `ROLE: ${role.role} at ${role.company} (${role.dates})\nBULLETS:\n${role.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}`
  ).join("\n\n");

  const prompt = `You are a professional resume writer. Select and lightly reframe bullets from the verified bullet bank to best match the job description.\n\nCRITICAL RULES:\n1. NEVER fabricate facts, metrics, or experience not in the bullet bank\n2. Only lightly rephrase for relevance — substance must remain identical\n3. Select 4-6 bullets for the most recent role, 2-3 for others\n4. Do not use em dashes\n5. Return ONLY valid JSON, no markdown\n\nJOB TITLE: ${jobTitle}\nCOMPANY: ${company}\nJOB DESCRIPTION: ${jd}\n\nVERIFIED BULLET BANK:\n${bulletBankText}\n\nReturn this exact JSON:\n{\n  "headline": "tailored headline (no company name, no em dashes)",\n  "summary": "tailored 3-sentence summary (no em dashes)",\n  "roles": [{"key": "amex_director", "selectedBullets": [0,1,2]}],\n  "fitScore": 85,\n  "fitRationale": "2-3 sentence honest assessment",\n  "gaps": "any real gaps to be aware of"\n}`;

  const data = await callAnthropic({ model: ANTHROPIC_MODEL, max_tokens: 1000, messages: [{ role: "user", content: prompt }] });
  const text = data.content?.find(b => b.type === "text")?.text || "";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return null; }
}

function generateResumeText(result) {
  if (!result) return "";
  let text = `${PROFILE.name}\n${PROFILE.contact}\n${result.headline}\n\nEXECUTIVE SUMMARY\n${result.summary}\n\nPROFESSIONAL EXPERIENCE\n`;
  result.roles?.forEach(r => {
    const rd = BULLET_BANK[r.key];
    if (!rd) return;
    text += `\n${rd.role} | ${rd.company} | ${rd.dates}\n`;
    r.selectedBullets?.forEach(i => { if (rd.bullets[i]) text += `• ${rd.bullets[i]}\n`; });
  });
  text += `\nEDUCATION & CERTIFICATIONS\n${PROFILE.education}\n${PROFILE.certifications}\n\nTECHNICAL SKILLS\nAI & Automation: ${PROFILE.skills.ai}\nPlatform & Architecture: ${PROFILE.skills.platform}\nRisk & Compliance: ${PROFILE.skills.risk}`;
  return text;
}

const STATUS = {
  new: { label: "New", color: "#2563EB", bg: "#1e3a5f" },
  saved: { label: "Saved", color: "#7C3AED", bg: "#2d1f5e" },
  applied: { label: "Applied", color: "#7C3AED", bg: "#2d1f5e" },
  screen: { label: "Screening", color: "#D97706", bg: "#3d2e0a" },
  interview: { label: "Interview", color: "#059669", bg: "#0a2e1e" },
  offer: { label: "Offer", color: "#16A34A", bg: "#0a2e10" },
  declined: { label: "Declined", color: "#6B7280", bg: "#1f1f2e" },
};

const S = {
  app: { fontFamily: "'DM Sans', system-ui, sans-serif", background: "#080810", minHeight: "100vh", color: "#E2E2F0" },
  header: { background: "linear-gradient(135deg, #0F0F1E 0%, #1A1040 100%)", padding: "24px 32px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  name: { fontSize: "20px", fontWeight: "700", color: "#E2E2F0", letterSpacing: "-0.4px" },
  sub: { fontSize: "12px", color: "#6B6B8A", marginTop: "2px" },
  metrics: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" },
  metric: { background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.05)" },
  mVal: (c) => ({ fontSize: "22px", fontWeight: "700", color: c, lineHeight: 1 }),
  mLabel: { fontSize: "10px", color: "#6B6B8A", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.06em" },
  tabs: { display: "flex", padding: "0 32px", gap: "2px", background: "#0C0C18", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  tab: (a) => ({ padding: "12px 20px", fontSize: "13px", fontWeight: "500", border: "none", background: "none", cursor: "pointer", color: a ? "#C084FC" : "#6B6B8A", borderBottom: a ? "2px solid #C084FC" : "2px solid transparent", transition: "all 0.15s" }),
  body: { padding: "24px 32px", maxWidth: "1100px" },
  sectionTitle: { fontSize: "15px", fontWeight: "600", color: "#E2E2F0", marginBottom: "14px" },
  card: { background: "#10101E", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "18px 22px", marginBottom: "10px" },
  label: { fontSize: "11px", color: "#6B6B8A", marginBottom: "5px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" },
  input: { width: "100%", background: "#080810", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "7px", padding: "9px 12px", color: "#E2E2F0", fontSize: "13px", outline: "none", fontFamily: "inherit" },
  textarea: { width: "100%", background: "#080810", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "7px", padding: "11px 12px", color: "#E2E2F0", fontSize: "13px", outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: "140px", lineHeight: "1.6" },
  btnPrimary: { background: "linear-gradient(135deg, #6D28D9, #C084FC)", color: "white", border: "none", borderRadius: "7px", padding: "10px 22px", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  btnSm: { background: "rgba(255,255,255,0.05)", color: "#B0B0D0", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "5px 12px", fontSize: "12px", cursor: "pointer" },
  btnDanger: { background: "rgba(239,68,68,0.08)", color: "#F87171", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" },
  badge: (s) => ({ display: "inline-block", padding: "2px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", background: STATUS[s]?.bg || "#1f1f2e", color: STATUS[s]?.color || "#6B7280" }),
  fitBadge: (n) => ({ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: n >= 80 ? "rgba(16,185,129,0.12)" : n >= 65 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)", color: n >= 80 ? "#34D399" : n >= 65 ? "#FBBF24" : "#F87171" }),
  row: { display: "flex", gap: "12px", marginBottom: "14px" },
  col: { flex: 1 },
  error: { color: "#F87171", fontSize: "12px", marginTop: "6px" },
  divider: { borderTop: "1px solid rgba(255,255,255,0.05)", margin: "16px 0" },
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" },
  modalBox: { background: "#10101E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "24px", maxWidth: "680px", width: "100%", maxHeight: "82vh", overflowY: "auto" },
  pre: { fontFamily: "monospace", fontSize: "11.5px", color: "#CBD5E1", lineHeight: "1.8", whiteSpace: "pre-wrap" },
  apiWarning: { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#FBBF24", marginBottom: "14px" },
};

export default function App() {
  const [tab, setTab] = useState("search");
  const [tracker, setTracker] = useState([]);
  const [foundJobs, setFoundJobs] = useState([]);
  const [tailoredResumes, setTailoredResumes] = useState({});
  const [searching, setSearching] = useState(false);
  const [searchLog, setSearchLog] = useState([]);
  const [searchProgress, setSearchProgress] = useState(0);
  const [jdInput, setJdInput] = useState("");
  const [jtInput, setJtInput] = useState("");
  const [coInput, setCoInput] = useState("");
  const [tailorResult, setTailorResult] = useState(null);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [tailorError, setTailorError] = useState("");
  const [resumeView, setResumeView] = useState(null);
  const [lastSearched, setLastSearched] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  useEffect(() => {
    load("tracker").then(d => d && setTracker(d));
    load("found_jobs").then(d => d && setFoundJobs(d));
    load("tailored_resumes").then(d => d && setTailoredResumes(d));
    load("last_searched").then(d => d && setLastSearched(d));
  }, []);

  const log = (msg) => setSearchLog(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev.slice(0, 19)]);

  const runSearch = async () => {
    setSearching(true);
    setSearchLog([]);
    setSearchProgress(0);
    let allJobs = [];
    const totalSteps = JSEARCH_QUERIES.length + TARGET_COMPANIES.length + INDEED_RSS_FEEDS.length;
    let step = 0;

    for (const query of JSEARCH_QUERIES) {
      log(`JSearch: "${query}"`);
      const jobs = await searchJSearch(query);
      log(`Found ${jobs.length} results`);
      allJobs.push(...jobs);
      step++; setSearchProgress(Math.round(step / totalSteps * 100));
    }

    for (const company of TARGET_COMPANIES) {
      log(`Checking ${company.name} (${company.platform})`);
      const jobs = company.platform === "greenhouse"
        ? await searchGreenhouse(company)
        : await searchLever(company);
      log(`${company.name}: ${jobs.length} product roles`);
      allJobs.push(...jobs);
      step++; setSearchProgress(Math.round(step / totalSteps * 100));
    }

    for (const feed of INDEED_RSS_FEEDS) {
      log(`Indeed RSS: ${feed.split("?q=")[1]?.split("&")[0]}`);
      const jobs = await fetchIndeedRSS(feed);
      log(`Found ${jobs.length} results`);
      allJobs.push(...jobs);
      step++; setSearchProgress(Math.round(step / totalSteps * 100));
    }

    const seen = new Set();
    allJobs = allJobs.filter(j => {
      const key = `${j.title?.toLowerCase()}-${j.company?.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });

    log(`Deduped to ${allJobs.length} unique jobs. Scoring with AI...`);

    const toScore = allJobs.slice(0, 30);
    const scored = await Promise.all(toScore.map(async j => {
      const score = await scoreJob(j);
      return { ...j, fitScore: score.fitScore, relevant: score.relevant, fitReason: score.reason, salaryOk: score.salaryOk };
    }));

    const relevant = scored
      .filter(j => j.relevant !== false && j.fitScore >= 60)
      .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));

    log(`Scoring complete. ${relevant.length} relevant matches found.`);
    setSearchProgress(100);

    const now = new Date().toISOString();
    setFoundJobs(relevant);
    setLastSearched(now);
    await save("found_jobs", relevant);
    await save("last_searched", now);
    setSearching(false);
  };

  const saveToTracker = async (job, tailored = null) => {
    const existing = tracker.find(j => j.id === job.id);
    if (existing) return;
    const entry = { ...job, status: "saved", savedAt: new Date().toISOString() };
    const updated = [...tracker, entry];
    setTracker(updated);
    await save("tracker", updated);
    if (tailored) {
      const updatedResumes = { ...tailoredResumes, [job.id]: tailored };
      setTailoredResumes(updatedResumes);
      await save("tailored_resumes", updatedResumes);
    }
  };

  const updateStatus = async (id, status) => {
    const updated = tracker.map(j => j.id === id ? { ...j, status } : j);
    setTracker(updated);
    await save("tracker", updated);
  };

  const removeFromTracker = async (id) => {
    const updated = tracker.filter(j => j.id !== id);
    setTracker(updated);
    await save("tracker", updated);
  };

  const handleTailor = async () => {
    if (!jdInput.trim() || !jtInput.trim() || !coInput.trim()) {
      setTailorError("Please fill in job title, company, and job description.");
      return;
    }
    setTailorError(""); setTailorLoading(true); setTailorResult(null);
    const result = await tailorResume(jdInput, jtInput, coInput);
    setTailorLoading(false);
    if (!result) { setTailorError("Something went wrong. Please try again."); return; }
    setTailorResult(result);
  };

  const sendDigest = async () => {
    if (!foundJobs.length) return;
    setEmailSending(true); setEmailStatus("");
    const top = foundJobs.slice(0, 10);
    const subject = `Job Search Digest — ${new Date().toLocaleDateString()}`;
    const body = `Good morning Bhanu,\n\nHere are your top job matches from today's search (${new Date().toLocaleDateString()}):\n\n${top.map((j, i) =>
      `${i + 1}. ${j.title} at ${j.company}\n   Location: ${j.location}${j.salary ? ` | Salary: ${j.salary}` : ""}\n   Fit Score: ${j.fitScore || "N/A"}% | ${j.fitReason || ""}\n   Apply: ${j.url}\n`
    ).join("\n")}\n\nTracker Summary:\n- Saved: ${tracker.filter(j => j.status === "saved").length}\n- Applied: ${tracker.filter(j => j.status === "applied").length}\n- In Progress: ${tracker.filter(j => ["screen", "interview"].includes(j.status)).length}\n- Offers: ${tracker.filter(j => j.status === "offer").length}\n\n— Your Job Search Suite`;

    const mailtoLink = `mailto:bhanu.s.kuna@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, "_blank");
    setEmailStatus("Digest opened in your email client.");
    setEmailSending(false);
  };

  const counts = {
    found: foundJobs.length,
    saved: tracker.filter(j => j.status === "saved").length,
    applied: tracker.filter(j => j.status === "applied").length,
    active: tracker.filter(j => ["screen", "interview"].includes(j.status)).length,
    offers: tracker.filter(j => j.status === "offer").length,
  };

  const noApiKey = !ANTHROPIC_API_KEY;

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={S.header}>
        <div style={S.headerRow}>
          <div>
            <div style={S.name}>Bhanu Kuna — Job Search Suite</div>
            <div style={S.sub}>Director of Product Management · AI Transformation · Credit Risk · $200K+ TC · Remote / Raleigh NC / NYC · Fintech + AI Product Roles</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#6B6B8A" }}>Last searched</div>
            <div style={{ fontSize: "12px", color: "#9090B0" }}>{lastSearched ? new Date(lastSearched).toLocaleString() : "Never"}</div>
          </div>
        </div>
        <div style={S.metrics}>
          {[["Found", counts.found, "#60A5FA"], ["Saved", counts.saved, "#C084FC"], ["Applied", counts.applied, "#A78BFA"], ["Active", counts.active, "#34D399"], ["Offers", counts.offers, "#FBBF24"]].map(([l, v, c]) => (
            <div key={l} style={S.metric}><div style={S.mVal(c)}>{v}</div><div style={S.mLabel}>{l}</div></div>
          ))}
        </div>
      </div>

      <div style={S.tabs}>
        {[["search", "Job Search"], ["tailor", "Resume Tailor"], ["tracker", "Tracker"], ["bullets", "Bullet Bank"]].map(([id, label]) => (
          <button key={id} style={S.tab(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div style={S.body}>

        {noApiKey && (
          <div style={S.apiWarning}>
            AI scoring and resume tailoring require an Anthropic API key. Set <strong>VITE_ANTHROPIC_API_KEY</strong> in your Vercel environment variables to enable these features. Job search and tracker work without it.
          </div>
        )}

        {tab === "search" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={S.sectionTitle}>Live Job Search</div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {emailStatus && <div style={{ fontSize: "12px", color: "#34D399" }}>{emailStatus}</div>}
                <button style={S.btnSm} onClick={sendDigest} disabled={emailSending || !foundJobs.length}>
                  {emailSending ? "Sending..." : "Email Digest"}
                </button>
                <button style={S.btnPrimary} onClick={runSearch} disabled={searching}>
                  {searching ? `Searching... ${searchProgress}%` : "Run Search"}
                </button>
              </div>
            </div>

            {searching && (
              <div style={{ ...S.card, marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ fontSize: "13px", color: "#C084FC", fontWeight: "500" }}>Searching across JSearch, Greenhouse, Lever, and Indeed RSS...</div>
                  <div style={{ fontSize: "13px", color: "#C084FC" }}>{searchProgress}%</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg, #6D28D9, #C084FC)", width: `${searchProgress}%`, transition: "width 0.3s" }} />
                </div>
                <div style={{ marginTop: "12px", maxHeight: "120px", overflowY: "auto" }}>
                  {searchLog.map((l, i) => <div key={i} style={{ fontSize: "11px", color: "#6B6B8A", lineHeight: "1.8" }}>{l}</div>)}
                </div>
              </div>
            )}

            {!searching && foundJobs.length === 0 && (
              <div style={{ ...S.card, textAlign: "center", padding: "48px", color: "#6B6B8A" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</div>
                <div style={{ fontSize: "14px", marginBottom: "6px", color: "#9090B0" }}>No jobs searched yet</div>
                <div style={{ fontSize: "13px" }}>Hit "Run Search" to sweep JSearch, Greenhouse, Lever, and Indeed RSS for fresh matches</div>
              </div>
            )}

            {foundJobs.map(job => (
              <div key={job.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#E2E2F0" }}>{job.title}</div>
                      {job.fitScore && <span style={S.fitBadge(job.fitScore)}>{job.fitScore}% fit</span>}
                      <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.05)", color: "#6B6B8A", padding: "2px 7px", borderRadius: "4px" }}>{job.source}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#7B7B9B" }}>{job.company} · {job.location}{job.salary ? ` · ${job.salary}` : ""}</div>
                    {job.fitReason && <div style={{ fontSize: "12px", color: "#5B5B7B", marginTop: "4px" }}>{job.fitReason}</div>}
                    {job.posted && <div style={{ fontSize: "11px", color: "#3B3B5B", marginTop: "3px" }}>Posted {new Date(job.posted).toLocaleDateString()}</div>}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ ...S.btnSm, textDecoration: "none" }}>View</a>}
                    <button style={S.btnSm} onClick={() => { setJtInput(job.title); setCoInput(job.company); setTab("tailor"); }}>Tailor</button>
                    <button style={S.btnSm} onClick={() => saveToTracker(job)}>Save</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "tailor" && (
          <div>
            <div style={S.sectionTitle}>Resume Tailor</div>
            <div style={S.card}>
              <div style={S.row}>
                <div style={S.col}><div style={S.label}>Job Title</div><input style={S.input} value={jtInput} onChange={e => setJtInput(e.target.value)} placeholder="e.g. Principal Product Manager" /></div>
                <div style={S.col}><div style={S.label}>Company</div><input style={S.input} value={coInput} onChange={e => setCoInput(e.target.value)} placeholder="e.g. Stripe" /></div>
              </div>
              <div style={{ marginBottom: "14px" }}><div style={S.label}>Job Description</div><textarea style={S.textarea} value={jdInput} onChange={e => setJdInput(e.target.value)} placeholder="Paste the full job description here..." /></div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button style={S.btnPrimary} onClick={handleTailor} disabled={tailorLoading || noApiKey}>{tailorLoading ? "Tailoring..." : "Tailor Resume"}</button>
                {tailorLoading && <div style={{ fontSize: "12px", color: "#6B6B8A" }}>Selecting best bullets from your verified bank...</div>}
                {noApiKey && <div style={{ fontSize: "12px", color: "#FBBF24" }}>Requires Anthropic API key</div>}
              </div>
              {tailorError && <div style={S.error}>{tailorError}</div>}
            </div>

            {tailorResult && (
              <div style={{ ...S.card, borderColor: "rgba(124,58,237,0.3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#E2E2F0" }}>Tailored Resume Ready</div>
                  <span style={S.fitBadge(tailorResult.fitScore)}>{tailorResult.fitScore}% fit</span>
                </div>
                <div style={{ fontSize: "12px", color: "#6B6B8A", marginBottom: "3px" }}>Headline</div>
                <div style={{ fontSize: "13px", color: "#C084FC", marginBottom: "12px", fontWeight: "500" }}>{tailorResult.headline}</div>
                <div style={{ fontSize: "12px", color: "#6B6B8A", marginBottom: "3px" }}>Summary</div>
                <div style={{ fontSize: "13px", color: "#B0B0D0", lineHeight: "1.7", marginBottom: "14px" }}>{tailorResult.summary}</div>
                <div style={{ fontSize: "12px", color: "#6B6B8A", marginBottom: "8px" }}>Selected Bullets</div>
                {tailorResult.roles?.map(r => {
                  const rd = BULLET_BANK[r.key];
                  if (!rd) return null;
                  return (
                    <div key={r.key} style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", color: "#6B6B8A", marginBottom: "5px", fontWeight: "600" }}>{rd.role} · {rd.company}</div>
                      {r.selectedBullets?.map(i => rd.bullets[i] && (
                        <div key={i} style={{ fontSize: "12px", color: "#9090B8", lineHeight: "1.7", marginBottom: "5px", paddingLeft: "10px", borderLeft: "2px solid rgba(192,132,252,0.25)" }}>• {rd.bullets[i]}</div>
                      ))}
                    </div>
                  );
                })}
                <div style={S.divider} />
                <div style={{ fontSize: "12px", color: "#34D399", fontWeight: "600", marginBottom: "3px" }}>Fit Assessment</div>
                <div style={{ fontSize: "12px", color: "#7090A0", lineHeight: "1.6", marginBottom: "8px" }}>{tailorResult.fitRationale}</div>
                {tailorResult.gaps && <>
                  <div style={{ fontSize: "12px", color: "#FBBF24", fontWeight: "600", marginBottom: "3px" }}>Gaps</div>
                  <div style={{ fontSize: "12px", color: "#7090A0", lineHeight: "1.6" }}>{tailorResult.gaps}</div>
                </> }
                <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                  <button style={S.btnPrimary} onClick={() => setResumeView(tailorResult)}>View Full Resume</button>
                  <button style={S.btnSm} onClick={() => saveToTracker({ id: Date.now(), title: jtInput, company: coInput, location: "", source: "Manual", fitScore: tailorResult.fitScore, fitReason: tailorResult.fitRationale }, tailorResult)}>Save to Tracker</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "tracker" && (
          <div>
            <div style={S.sectionTitle}>Application Tracker</div>
            {tracker.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: "40px", color: "#6B6B8A" }}>No applications tracked yet. Save roles from the Search tab or tailor a resume to add here.</div>
            ) : (
              tracker.map(job => (
                <div key={job.id} style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "2px", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "#E2E2F0" }}>{job.title}</div>
                        <span style={S.badge(job.status)}>{STATUS[job.status]?.label || job.status}</span>
                        {job.fitScore && <span style={S.fitBadge(job.fitScore)}>{job.fitScore}% fit</span>}
                      </div>
                      <div style={{ fontSize: "13px", color: "#7B7B9B" }}>{job.company}{job.location ? ` · ${job.location}` : ""}{job.salary ? ` · ${job.salary}` : ""}</div>
                      {job.fitReason && <div style={{ fontSize: "12px", color: "#5B5B7B", marginTop: "4px" }}>{job.fitReason}</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                      <select value={job.status} onChange={e => updateStatus(job.id, e.target.value)} style={{ background: "#080810", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#E2E2F0", padding: "4px 8px", fontSize: "11px", cursor: "pointer" }}>
                        {Object.entries(STATUS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                      </select>
                      <div style={{ display: "flex", gap: "5px" }}>
                        {tailoredResumes[job.id] && <button style={S.btnSm} onClick={() => setResumeView(tailoredResumes[job.id])}>Resume</button>}
                        {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ ...S.btnSm, textDecoration: "none" }}>View</a>}
                        <button style={S.btnDanger} onClick={() => removeFromTracker(job.id)}>Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "bullets" && (
          <div>
            <div style={S.sectionTitle}>Verified Bullet Bank</div>
            <div style={{ fontSize: "12px", color: "#6B6B8A", marginBottom: "16px" }}>All bullets personally validated as accurate. The tailor engine only selects from these — no fabrication possible.</div>
            {Object.values(BULLET_BANK).map(role => (
              <div key={role.role} style={S.card}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#C084FC", marginBottom: "2px" }}>{role.role}</div>
                <div style={{ fontSize: "11px", color: "#6B6B8A", marginBottom: "10px" }}>{role.company} · {role.dates}</div>
                {role.bullets.map((b, i) => (
                  <div key={i} style={{ fontSize: "12px", color: "#8888A8", lineHeight: "1.7", marginBottom: "6px", paddingLeft: "10px", borderLeft: "2px solid rgba(192,132,252,0.2)" }}>• {b}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {resumeView && (
        <div style={S.modal} onClick={() => setResumeView(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "15px", fontWeight: "600", color: "#E2E2F0" }}>Tailored Resume</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={S.btnSm} onClick={() => navigator.clipboard.writeText(generateResumeText(resumeView))}>Copy</button>
                <button style={S.btnSm} onClick={() => setResumeView(null)}>Close</button>
              </div>
            </div>
            <pre style={S.pre}>{generateResumeText(resumeView)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
