import type { SpendCategory } from "./types";

interface CategoryRule {
  category: SpendCategory;
  keywords: RegExp[];
}

/**
 * Order matters — the first matching rule wins, so put more specific
 * matchers (e.g. "credit card payment") above broader ones ("payment").
 */
export const CATEGORY_RULES: CategoryRule[] = [
  // ── Income (matches by keyword; cash-flow direction is also checked separately) ──
  {
    category: "Income",
    keywords: [
      /\b(payroll|direct\s+deposit|salary|wages|payday|employer)\b/i,
      /\bdeposit\s+from\b/i,
      /\bach\s+credit\b/i,
      /\binterest\s+earned\b/i,
      /\bdividend\b/i,
    ],
  },

  // ── Mortgage / Rent ────────────────────────────────────────────────
  {
    category: "Mortgage & Rent",
    keywords: [
      /\b(mortgage|escrow)\b/i,
      /\b(rocket\s+mortgage|wells\s+fargo\s+home|chase\s+mortgage|bank\s+of\s+america\s+home|loanDepot|nationstar|mr\s*cooper|caliber\s+home|pennymac)\b/i,
      /\b(rent\s+payment|landlord|property\s+management|apartment\s+rent)\b/i,
    ],
  },

  // ── Credit Card Payments ───────────────────────────────────────────
  {
    category: "Credit Card Payments",
    keywords: [
      /\b(credit\s+card\s+payment|cc\s+payment|card\s+payment)\b/i,
      /\bautopay.*(?:chase|amex|american\s+express|discover|capital\s+one|citi|citibank|barclays|us\s+bank|synchrony|wells\s+fargo\s+card)\b/i,
      /\b(amex\s+epayment|chase\s+credit|chase\s+card|discover\s+payment|capital\s+one\s+payment|citi\s+card)\b/i,
    ],
  },

  // ── Auto & Transportation ──────────────────────────────────────────
  {
    category: "Auto & Transportation",
    keywords: [
      // Gas stations
      /\b(chevron|shell|exxon|mobil|bp|sunoco|valero|conoco|76\b|arco|circle\s+k|wawa|sheetz|costco\s+gas)\b/i,
      /\bgas\s+station\b/i,
      // Auto loans / leases
      /\b(ford\s+credit|honda\s+(?:fin|financial)|toyota\s+fin|gm\s+financial|tesla\s+motors|nissan\s+motor\s+accept|hyundai\s+motor|bmw\s+financial|mercedes-?benz\s+fin)\b/i,
      /\b(auto\s+loan|car\s+payment|vehicle\s+payment|car\s+lease)\b/i,
      // Rideshare / transit / parking
      /\b(uber|lyft|toll|parking|metro|caltrain|mta\b|bart|amtrak|septa)\b/i,
      // Service / repairs
      /\b(jiffy\s+lube|midas|firestone|valvoline|auto\s+repair|tire|oil\s+change)\b/i,
    ],
  },

  // ── Utilities ──────────────────────────────────────────────────────
  {
    category: "Utilities",
    keywords: [
      // Internet / phone / TV
      /\b(comcast|xfinity|verizon|at&?t|t-?mobile|sprint|spectrum|cox\s+comm|fios|google\s+fiber|starlink)\b/i,
      // Power / water / gas
      /\b(pg&?e|edison|con\s?ed|duke\s+energy|dominion\s+energy|national\s+grid|nicor|peco|water\s+bill|electric\s+bill|gas\s+company|sewer|utility)\b/i,
    ],
  },

  // ── Insurance ──────────────────────────────────────────────────────
  {
    category: "Insurance",
    keywords: [
      /\b(geico|progressive|state\s+farm|allstate|liberty\s+mutual|farmers\s+ins|travelers\s+ins|metlife|nationwide\s+ins|usaa)\b/i,
      /\b(health\s+insurance|life\s+insurance|home\s+insurance|auto\s+insurance|renters\s+insurance|insurance\s+premium)\b/i,
    ],
  },

  // ── Groceries ──────────────────────────────────────────────────────
  {
    category: "Groceries",
    keywords: [
      /\b(whole\s+foods|trader\s+joe|kroger|safeway|wegmans|publix|aldi|sprouts|albertsons|food\s+lion|stop\s+(?:and|&)\s+shop|h-?e-?b|costco\s+wholesale|sam'?s\s+club|bj's\s+wholesale|fresh\s+market|harris\s+teeter|giant\s+food|meijer|winco)\b/i,
      /\b(grocery|supermarket|market\s+basket)\b/i,
    ],
  },

  // ── Dining & Coffee ────────────────────────────────────────────────
  {
    category: "Dining & Coffee",
    keywords: [
      // Coffee
      /\b(starbucks|dunkin|peet'?s|blue\s+bottle|philz|caribou|tim\s+hortons|coffee)\b/i,
      // Delivery
      /\b(doordash|uber\s+eats|grubhub|seamless|postmates|caviar)\b/i,
      // Fast food / chains
      /\b(mcdonald|chipotle|chick-?fil-?a|panera|subway|domino|pizza|sweetgreen|cava|wendy|burger\s+king|taco\s+bell|kfc|popeyes|wing\s*stop|five\s+guys|in-?n-?out|whataburger|culver|jersey\s+mike|qdoba)\b/i,
      // Generic
      /\b(restaurant|cafe|bistro|diner|grill|kitchen|tavern|brewery|pub)\b/i,
    ],
  },

  // ── Healthcare ─────────────────────────────────────────────────────
  {
    category: "Healthcare",
    keywords: [
      /\b(cvs|walgreens|rite\s+aid|kaiser|blue\s+cross|aetna|cigna|united\s+healthcare|anthem|humana)\b/i,
      /\b(pharmacy|doctor|medical|dental|hospital|clinic|urgent\s+care|optometr|orthodont|chiropract)\b/i,
    ],
  },

  // ── Subscriptions ──────────────────────────────────────────────────
  {
    category: "Subscriptions",
    keywords: [
      /\b(netflix|hulu|disney\+?|disneyplus|spotify|apple\s+music|hbo\s+max|max\.com|peacock|paramount\+?|youtube\s+premium|crunchyroll|fubo|sling\s+tv)\b/i,
      /\b(adobe|dropbox|notion|github|figma|grammarly|loom|linear\.app|microsoft\s+365|google\s+one|icloud)\b/i,
      /\b(nordvpn|expressvpn|1password|lastpass|surfshark)\b/i,
      /\b(amazon\s+prime|prime\s+video|nytimes|nyt\s+digital|wsj|wapo|washington\s+post|the\s+atlantic)\b/i,
      /\b(peloton|classpass|calm|headspace|noom|duolingo|coursera|skillshare|masterclass|udemy)\b/i,
      /\b(xbox\s+game\s+pass|playstation\s+plus|nintendo\s+switch\s+online|ea\s+play|ubisoft)\b/i,
      /\b(subscription|monthly\s+plan|annual\s+plan)\b/i,
    ],
  },

  // ── Travel ─────────────────────────────────────────────────────────
  {
    category: "Travel",
    keywords: [
      /\b(airbnb|expedia|booking\.com|hotels?\.com|vrbo|kayak|priceline|orbitz|trivago)\b/i,
      /\b(marriott|hilton|hyatt|sheraton|westin|holiday\s+inn|hampton\s+inn|courtyard|residence\s+inn)\b/i,
      /\b(delta|united|american\s+airlines|southwest|jetblue|alaska\s+air|spirit\s+air|frontier\s+air|allegiant)\b/i,
      /\b(hotel|motel|airline|airfare|airport)\b/i,
    ],
  },

  // ── Shopping ───────────────────────────────────────────────────────
  {
    category: "Shopping",
    keywords: [
      /\b(amazon|amzn\s*mktp|target|walmart|best\s+buy|home\s+depot|lowe'?s|ikea|ebay|etsy|costco|macy'?s|nordstrom|kohl'?s|tj\s*maxx|marshalls|ross\s+stores|nike|adidas|lululemon|uniqlo|h&m|zara|gap\s+inc|old\s+navy|sephora|ulta)\b/i,
    ],
  },

  // ── Entertainment ──────────────────────────────────────────────────
  {
    category: "Entertainment",
    keywords: [
      /\b(amc\s+theatres|regal\s+cinemas|cinemark|movie\s+theater|imax|alamo\s+drafthouse)\b/i,
      /\b(ticketmaster|stubhub|live\s+nation|seatgeek|axs\b|eventbrite)\b/i,
      /\b(concert|festival|stadium|arena)\b/i,
    ],
  },

  // ── Transfers ──────────────────────────────────────────────────────
  {
    category: "Transfers",
    keywords: [
      /\b(zelle|venmo|cash\s*app|paypal|apple\s+cash)\b/i,
      /\b(wire\s+transfer|ach\s+transfer|internal\s+transfer|to\s+savings|from\s+savings|own\s+transfer|transfer\s+to|transfer\s+from)\b/i,
    ],
  },

  // ── Fees ───────────────────────────────────────────────────────────
  {
    category: "Fees",
    keywords: [
      /\b(atm\s+fee|overdraft|service\s+fee|monthly\s+(?:maintenance\s+)?fee|maintenance\s+fee|wire\s+fee|foreign\s+transaction|nsf\s+fee|late\s+fee)\b/i,
    ],
  },
];

export function categorizeDescription(description: string): SpendCategory {
  for (const rule of CATEGORY_RULES) {
    for (const re of rule.keywords) {
      if (re.test(description)) return rule.category;
    }
  }
  return "Other";
}

export const CATEGORY_META: Record<
  SpendCategory,
  { emoji: string; tone: "income" | "fixed" | "variable" | "neutral" }
> = {
  "Income":                { emoji: "💰", tone: "income" },
  "Credit Card Payments":  { emoji: "💳", tone: "fixed" },
  "Mortgage & Rent":       { emoji: "🏠", tone: "fixed" },
  "Auto & Transportation": { emoji: "🚗", tone: "fixed" },
  "Utilities":             { emoji: "💡", tone: "fixed" },
  "Insurance":             { emoji: "🛡️", tone: "fixed" },
  "Groceries":             { emoji: "🛒", tone: "variable" },
  "Dining & Coffee":       { emoji: "🍔", tone: "variable" },
  "Healthcare":            { emoji: "🏥", tone: "variable" },
  "Subscriptions":         { emoji: "📺", tone: "variable" },
  "Shopping":              { emoji: "🛍️", tone: "variable" },
  "Entertainment":         { emoji: "🎬", tone: "variable" },
  "Travel":                { emoji: "✈️", tone: "variable" },
  "Transfers":             { emoji: "🔁", tone: "neutral" },
  "Fees":                  { emoji: "⚠️", tone: "neutral" },
  "Other":                 { emoji: "📦", tone: "neutral" },
};
