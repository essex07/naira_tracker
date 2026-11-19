import type {
  CategoryKey,
  CategoryMatch,
} from "@/lib/types";

export const CATEGORY_META: Record<
  CategoryKey,
  {
    label: string;
    blurb: string;
    tone: string;
    soft: string;
    ink: string;
  }
> = {
  survival: {
    label: "Survival",
    blurb: "Rent, utilities, health, essentials",
    tone: "#2A7259",
    soft: "#E6F0EA",
    ink: "#174B39",
  },
  transport: {
    label: "Transport",
    blurb: "Fares, fuel, vehicle costs",
    tone: "#3D6F8E",
    soft: "#E5EEF4",
    ink: "#244A61",
  },
  food: {
    label: "Food stuff",
    blurb: "Market, groceries, meals",
    tone: "#B06A36",
    soft: "#F7EADD",
    ink: "#744121",
  },
  debt: {
    label: "Debt",
    blurb: "Loans, repayments, obligations",
    tone: "#A34D47",
    soft: "#F7E5E2",
    ink: "#6D2E2A",
  },
  savings: {
    label: "Savings",
    blurb: "Emergency fund and goals",
    tone: "#A6812D",
    soft: "#F5ECD3",
    ink: "#6B521A",
  },
  others: {
    label: "Others",
    blurb: "Lifestyle, gifts, subscriptions",
    tone: "#745C91",
    soft: "#EEE8F4",
    ink: "#4C3A64",
  },
  miscellaneous: {
    label: "Miscellaneous",
    blurb: "Unplanned extras and one-offs",
    tone: "#6B7A5A",
    soft: "#EEF2E7",
    ink: "#46523A",
  },
};

const CATEGORY_KEYWORDS: Record<CategoryKey, readonly string[]> = {
  survival: [
    "rent",
    "house rent",
    "apartment rent",
    "electricity",
    "electricity bill",
    "light bill",
    "nepa",
    "power bill",
    "prepaid meter",
    "water bill",
    "water board",
    "borehole",
    "cooking gas",
    "gas refill",
    "gas cylinder",
    "kerosene",
    "generator",
    "generator fuel",
    "generator repair",
    "gen repair",
    "house repair",
    "home repair",
    "plumbing",
    "plumber",
    "electrician",
    "toiletries",
    "toothpaste",
    "soap",
    "detergent",
    "medicine",
    "drugs",
    "pharmacy",
    "hospital",
    "clinic",
    "doctor",
    "medical",
    "health",
    "insurance",
    "school fees",
    "school fee",
    "tuition",
    "airtime",
    "recharge card",
    "data subscription",
    "internet",
    "wifi",
    "utility",
    "utilities",
    "security levy",
    "waste disposal",
    "laundry",
    "bulb",
    "batteries",
    "candle",
    "first aid",
    "rent allowance",
    "housekeeping",
  ],
  transport: [
    "transport",
    "transportation",
    "transport fare",
    "bus",
    "bus fare",
    "danfo",
    "taxi",
    "cab",
    "keke",
    "keke napep",
    "napep",
    "tricycle",
    "okada",
    "bike",
    "motorcycle",
    "ride",
    "uber",
    "bolt",
    "lagride",
    "fare",
    "fuel",
    "petrol",
    "diesel",
    "cng",
    "toll",
    "toll gate",
    "parking",
    "car wash",
    "car repair",
    "mechanic",
    "tyre",
    "tyres",
    "tire",
    "tires",
    "car service",
    "car maintenance",
    "engine oil",
    "vehicle licence",
    "vehicle license",
    "driver",
    "train",
    "ferry",
    "flight",
    "airfare",
    "plane ticket",
  ],
  food: [
    "food",
    "foodstuff",
    "food stuff",
    "rice",
    "beans",
    "garri",
    "semovita",
    "yam",
    "plantain",
    "potato",
    "tomato",
    "tomatoes",
    "pepper",
    "onion",
    "onions",
    "vegetable",
    "vegetables",
    "palm oil",
    "vegetable oil",
    "cooking oil",
    "market",
    "supermarket",
    "grocery",
    "groceries",
    "provision",
    "provisions",
    "egg",
    "eggs",
    "chicken",
    "meat",
    "fish",
    "bread",
    "milk",
    "cereal",
    "spaghetti",
    "noodles",
    "pasta",
    "seasoning",
    "maggi",
    "salt",
    "sugar",
    "flour",
    "egusi",
    "okra",
    "fruit",
    "fruits",
    "snack",
    "snacks",
    "lunch",
    "breakfast",
    "dinner",
    "restaurant",
    "eatery",
    "buka",
    "canteen",
    "bottle water",
    "sachet water",
    "suya",
    "shawarma",
  ],
  debt: [
    "debt",
    "loan",
    "loan repayment",
    "repayment",
    "installment",
    "instalment",
    "credit card",
    "interest",
    "pay back",
    "payback",
    "borrow",
    "borrowed",
    "owed",
    "owe",
    "debt payment",
    "bank loan",
    "personal loan",
  ],
  savings: [
    "savings",
    "saving",
    "save",
    "saved",
    "emergency fund",
    "investment",
    "invest",
    "fixed deposit",
    "ajo",
    "esusu",
    "thrift",
    "cooperative",
    "coop",
    "piggy bank",
    "unit trust",
    "mutual fund",
    "treasury bill",
    "target savings",
    "save money",
  ],
  others: [
    "clothes",
    "clothing",
    "shoe",
    "shoes",
    "bag",
    "gift",
    "gifts",
    "donation",
    "church offering",
    "offering",
    "tithe",
    "subscription",
    "netflix",
    "spotify",
    "showmax",
    "entertainment",
    "cinema",
    "movie",
    "party",
    "personal care",
    "perfume",
    "makeup",
    "skincare",
    "jewellery",
    "jewelry",
    "electronics",
    "phone",
    "laptop",
    "furniture",
  ],
  miscellaneous: [
    "miscellaneous",
    "misc",
    "other",
    "others",
    "one off",
    "one-time",
    "unplanned",
    "unexpected",
    "uncategorised",
    "uncategorized",
    "random",
  ],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(haystack: string, needle: string): boolean {
  return ` ${haystack} `.includes(` ${needle} `);
}

/**
 * Picks the longest keyword phrase found in the description. Longest wins so
 * "generator fuel" beats "fuel", and "water bill" beats "water".
 */
export function matchCategory(description: string): CategoryMatch {
  const normalized = normalize(description);

  if (!normalized) {
    return { key: "others", keyword: null, matched: false };
  }

  let best: { key: CategoryKey; keyword: string; score: number } | null = null;

  for (const key of Object.keys(CATEGORY_KEYWORDS) as CategoryKey[]) {
    for (const keyword of CATEGORY_KEYWORDS[key]) {
      const normalizedKeyword = normalize(keyword);

      if (!containsPhrase(normalized, normalizedKeyword)) {
        continue;
      }

      const score =
        normalizedKeyword.length * 10 + normalizedKeyword.split(" ").length;

      if (!best || score > best.score) {
        best = { key, keyword, score };
      }
    }
  }

  if (!best) {
    return { key: "others", keyword: null, matched: false };
  }

  return { key: best.key, keyword: best.keyword, matched: true };
}
