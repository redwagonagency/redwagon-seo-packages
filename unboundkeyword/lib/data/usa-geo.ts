// US States with abbreviations
export interface UsState {
  name: string;
  abbr: string;
  dfsLocationCode?: number;
}

export const US_STATES: UsState[] = [
  { name: "Alabama", abbr: "AL" },
  { name: "Alaska", abbr: "AK" },
  { name: "Arizona", abbr: "AZ" },
  { name: "Arkansas", abbr: "AR" },
  { name: "California", abbr: "CA" },
  { name: "Colorado", abbr: "CO" },
  { name: "Connecticut", abbr: "CT" },
  { name: "Delaware", abbr: "DE" },
  { name: "Florida", abbr: "FL" },
  { name: "Georgia", abbr: "GA" },
  { name: "Hawaii", abbr: "HI" },
  { name: "Idaho", abbr: "ID" },
  { name: "Illinois", abbr: "IL" },
  { name: "Indiana", abbr: "IN" },
  { name: "Iowa", abbr: "IA" },
  { name: "Kansas", abbr: "KS" },
  { name: "Kentucky", abbr: "KY" },
  { name: "Louisiana", abbr: "LA" },
  { name: "Maine", abbr: "ME" },
  { name: "Maryland", abbr: "MD" },
  { name: "Massachusetts", abbr: "MA" },
  { name: "Michigan", abbr: "MI" },
  { name: "Minnesota", abbr: "MN" },
  { name: "Mississippi", abbr: "MS" },
  { name: "Missouri", abbr: "MO" },
  { name: "Montana", abbr: "MT" },
  { name: "Nebraska", abbr: "NE" },
  { name: "Nevada", abbr: "NV" },
  { name: "New Hampshire", abbr: "NH" },
  { name: "New Jersey", abbr: "NJ" },
  { name: "New Mexico", abbr: "NM" },
  { name: "New York", abbr: "NY" },
  { name: "North Carolina", abbr: "NC" },
  { name: "North Dakota", abbr: "ND" },
  { name: "Ohio", abbr: "OH" },
  { name: "Oklahoma", abbr: "OK" },
  { name: "Oregon", abbr: "OR" },
  { name: "Pennsylvania", abbr: "PA" },
  { name: "Rhode Island", abbr: "RI" },
  { name: "South Carolina", abbr: "SC" },
  { name: "South Dakota", abbr: "SD" },
  { name: "Tennessee", abbr: "TN" },
  { name: "Texas", abbr: "TX" },
  { name: "Utah", abbr: "UT" },
  { name: "Vermont", abbr: "VT" },
  { name: "Virginia", abbr: "VA" },
  { name: "Washington", abbr: "WA" },
  { name: "West Virginia", abbr: "WV" },
  { name: "Wisconsin", abbr: "WI" },
  { name: "Wyoming", abbr: "WY" },
  { name: "District of Columbia", abbr: "DC" },
];

// DMA database — Nielsen Designated Market Areas with major cities
export interface DmaMarket {
  id: string;           // Nielsen DMA code (string)
  name: string;         // Display name
  state: string;        // Primary state abbr
  cities: string[];     // Major cities/towns in this DMA
  aliases: Record<string, string>;  // city name → short alias (e.g. Los Angeles → LA)
  primaryZips?: string[]; // Representative zip codes for this DMA
}

export const US_DMAS: DmaMarket[] = [
  {
    id: "501", name: "New York", state: "NY",
    cities: ["New York City", "Brooklyn", "Queens", "The Bronx", "Staten Island", "Manhattan", "Newark", "Jersey City", "Yonkers", "Hoboken", "White Plains"],
    aliases: { "New York City": "NYC", "New York": "NYC" },
  },
  {
    id: "803", name: "Los Angeles", state: "CA",
    cities: ["Los Angeles", "Long Beach", "Pasadena", "Glendale", "Burbank", "Santa Monica", "Torrance", "Anaheim", "Irvine", "Van Nuys", "Hollywood", "West Hollywood", "Culver City", "El Monte", "Pomona", "Compton"],
    aliases: { "Los Angeles": "LA" },
  },
  {
    id: "602", name: "Chicago", state: "IL",
    cities: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Elgin", "Schaumburg", "Evanston", "Oak Park", "Waukegan", "Gary"],
    aliases: { "Chicago": "Chi-Town" },
  },
  {
    id: "504", name: "Philadelphia", state: "PA",
    cities: ["Philadelphia", "Camden", "Chester", "Norristown", "Reading", "Bethlehem", "Allentown", "Wilmington", "South Jersey"],
    aliases: { "Philadelphia": "Philly" },
  },
  {
    id: "506", name: "Boston", state: "MA",
    cities: ["Boston", "Cambridge", "Somerville", "Quincy", "Newton", "Lowell", "Lynn", "Worcester", "Providence", "Manchester NH"],
    aliases: { "Boston": "Bos" },
  },
  {
    id: "807", name: "San Francisco", state: "CA",
    cities: ["San Francisco", "Oakland", "San Jose", "Berkeley", "Fremont", "Hayward", "Santa Clara", "Sunnyvale", "Mountain View", "Palo Alto", "Milpitas", "San Mateo", "Redwood City", "Daly City"],
    aliases: { "San Francisco": "SF", "San Jose": "SJ" },
  },
  {
    id: "623", name: "Dallas", state: "TX",
    cities: ["Dallas", "Fort Worth", "Arlington", "Plano", "Garland", "Irving", "Frisco", "McKinney", "Mesquite", "Carrollton", "Denton"],
    aliases: { "Dallas": "Big D", "Fort Worth": "FTW" },
  },
  {
    id: "618", name: "Houston", state: "TX",
    cities: ["Houston", "Sugar Land", "Pearland", "Katy", "Pasadena TX", "Baytown", "Conroe", "Galveston", "League City", "Friendswood"],
    aliases: {},
  },
  {
    id: "511", name: "Washington DC", state: "DC",
    cities: ["Washington DC", "Arlington VA", "Alexandria VA", "Bethesda MD", "Rockville MD", "Silver Spring MD", "Tysons", "Fairfax VA", "McLean VA", "Reston VA", "Falls Church VA"],
    aliases: { "Washington DC": "DC", "Washington": "DC" },
  },
  {
    id: "524", name: "Atlanta", state: "GA",
    cities: ["Atlanta", "Marietta", "Sandy Springs", "Roswell", "Johns Creek", "Alpharetta", "Smyrna", "Peachtree City", "Gainesville GA"],
    aliases: { "Atlanta": "ATL" },
  },
  {
    id: "539", name: "Tampa", state: "FL",
    cities: ["Tampa", "St. Petersburg", "Clearwater", "Brandon", "Lakeland", "Sarasota", "Bradenton", "Wesley Chapel", "New Port Richey"],
    aliases: { "Tampa": "TPA", "St. Petersburg": "St Pete" },
  },
  {
    id: "528", name: "Miami", state: "FL",
    cities: ["Miami", "Fort Lauderdale", "Boca Raton", "West Palm Beach", "Hialeah", "Coral Springs", "Hollywood FL", "Pompano Beach", "Delray Beach", "Deerfield Beach"],
    aliases: { "Miami": "MIA", "Fort Lauderdale": "Fort Laud" },
  },
  {
    id: "616", name: "Minneapolis", state: "MN",
    cities: ["Minneapolis", "Saint Paul", "Bloomington", "Plymouth", "Brooklyn Park", "Maple Grove", "Coon Rapids", "Burnsville", "Apple Valley"],
    aliases: { "Minneapolis": "Mpls", "Saint Paul": "St Paul" },
  },
  {
    id: "535", name: "Cleveland", state: "OH",
    cities: ["Cleveland", "Akron", "Canton", "Parma", "Lorain", "Elyria", "Strongsville", "Sandusky"],
    aliases: { "Cleveland": "CLE" },
  },
  {
    id: "508", name: "Detroit", state: "MI",
    cities: ["Detroit", "Warren", "Sterling Heights", "Ann Arbor", "Dearborn", "Livonia", "Troy", "Westland", "Flint", "Lansing"],
    aliases: { "Detroit": "DTW" },
  },
  {
    id: "613", name: "Phoenix", state: "AZ",
    cities: ["Phoenix", "Scottsdale", "Mesa", "Tempe", "Chandler", "Gilbert", "Peoria AZ", "Glendale AZ", "Surprise AZ", "Avondale"],
    aliases: { "Phoenix": "PHX" },
  },
  {
    id: "819", name: "Seattle", state: "WA",
    cities: ["Seattle", "Bellevue", "Tacoma", "Renton", "Kirkland", "Redmond", "Everett", "Sammamish", "Kent", "Olympia"],
    aliases: { "Seattle": "SEA" },
  },
  {
    id: "543", name: "Richmond", state: "VA",
    cities: ["Richmond VA", "Henrico", "Chesterfield", "Midlothian", "Mechanicsville"],
    aliases: {},
  },
  {
    id: "527", name: "Indianapolis", state: "IN",
    cities: ["Indianapolis", "Carmel", "Fishers", "Noblesville", "Anderson", "Lawrence", "Greenwood"],
    aliases: { "Indianapolis": "Indy" },
  },
  {
    id: "533", name: "Portland", state: "OR",
    cities: ["Portland", "Beaverton", "Gresham", "Hillsboro", "Lake Oswego", "Tigard", "Vancouver WA", "Tualatin"],
    aliases: { "Portland": "PDX" },
  },
  {
    id: "561", name: "Charlotte", state: "NC",
    cities: ["Charlotte", "Concord NC", "Gastonia", "Rock Hill SC", "Huntersville", "Kannapolis", "Matthews NC"],
    aliases: { "Charlotte": "CLT" },
  },
  {
    id: "641", name: "San Diego", state: "CA",
    cities: ["San Diego", "Chula Vista", "El Cajon", "Escondido", "Oceanside", "Carlsbad", "El Cajon", "National City", "La Mesa"],
    aliases: { "San Diego": "SD" },
  },
  {
    id: "752", name: "Denver", state: "CO",
    cities: ["Denver", "Aurora CO", "Lakewood", "Thornton", "Arvada", "Westminster CO", "Pueblo", "Boulder", "Fort Collins", "Centennial"],
    aliases: { "Denver": "DEN" },
  },
  {
    id: "544", name: "Norfolk", state: "VA",
    cities: ["Norfolk", "Virginia Beach", "Chesapeake", "Hampton", "Newport News", "Portsmouth VA", "Suffolk VA"],
    aliases: {},
  },
  {
    id: "520", name: "Baltimore", state: "MD",
    cities: ["Baltimore", "Columbia MD", "Towson", "Ellicott City", "Bowie", "Frederick MD", "Annapolis"],
    aliases: { "Baltimore": "Bmore" },
  },
  {
    id: "670", name: "New Orleans", state: "LA",
    cities: ["New Orleans", "Metairie", "Baton Rouge", "Kenner", "Bossier City", "Slidell"],
    aliases: { "New Orleans": "NOLA" },
  },
  {
    id: "532", name: "Sacramento", state: "CA",
    cities: ["Sacramento", "Elk Grove", "Roseville", "Folsom", "Citrus Heights", "Rancho Cordova", "Davis CA", "Stockton"],
    aliases: { "Sacramento": "Sac" },
  },
  {
    id: "577", name: "Cincinnati", state: "OH",
    cities: ["Cincinnati", "Covington KY", "Middletown OH", "Hamilton OH", "Florence KY", "Newport KY"],
    aliases: { "Cincinnati": "Cincy" },
  },
  {
    id: "596", name: "Kansas City", state: "MO",
    cities: ["Kansas City", "Overland Park", "Olathe", "Independence MO", "Lee's Summit", "Shawnee KS", "Johnson County"],
    aliases: { "Kansas City": "KC" },
  },
  {
    id: "548", name: "Pittsburgh", state: "PA",
    cities: ["Pittsburgh", "McKeesport", "Bethel Park", "Monroeville", "Mount Lebanon", "Canonsburg"],
    aliases: { "Pittsburgh": "PGH" },
  },
  {
    id: "559", name: "Salt Lake City", state: "UT",
    cities: ["Salt Lake City", "Provo", "West Valley City", "Ogden", "Sandy UT", "Orem", "West Jordan", "Draper"],
    aliases: { "Salt Lake City": "SLC" },
  },
  {
    id: "650", name: "Austin", state: "TX",
    cities: ["Austin", "Round Rock", "Cedar Park", "Pflugerville", "Georgetown TX", "Kyle TX", "San Marcos"],
    aliases: { "Austin": "ATX" },
  },
  {
    id: "685", name: "San Antonio", state: "TX",
    cities: ["San Antonio", "New Braunfels", "Boerne", "Seguin", "Universal City TX", "Schertz"],
    aliases: { "San Antonio": "SA" },
  },
  {
    id: "757", name: "Nashville", state: "TN",
    cities: ["Nashville", "Murfreesboro", "Franklin TN", "Hendersonville", "Brentwood TN", "Smyrna TN", "Mount Juliet"],
    aliases: { "Nashville": "Nash" },
  },
  {
    id: "563", name: "Raleigh", state: "NC",
    cities: ["Raleigh", "Durham", "Chapel Hill", "Cary", "Apex", "Morrisville NC", "Wake Forest"],
    aliases: { "Raleigh": "RDU" },
  },
  {
    id: "698", name: "Las Vegas", state: "NV",
    cities: ["Las Vegas", "Henderson", "North Las Vegas", "Boulder City", "Summerlin", "Paradise NV"],
    aliases: { "Las Vegas": "Vegas" },
  },
  {
    id: "640", name: "Memphis", state: "TN",
    cities: ["Memphis", "Bartlett", "Germantown TN", "Collierville", "Shelby County", "Southaven MS"],
    aliases: {},
  },
  {
    id: "636", name: "Louisville", state: "KY",
    cities: ["Louisville", "Lexington KY", "Jeffersontown", "Elizabethtown", "New Albany IN"],
    aliases: {},
  },
  {
    id: "605", name: "Columbus", state: "OH",
    cities: ["Columbus OH", "Dublin OH", "Hilliard", "Westerville", "Reynoldsburg", "Grove City OH", "Gahanna"],
    aliases: {},
  },
  {
    id: "555", name: "Jacksonville", state: "FL",
    cities: ["Jacksonville FL", "Orange Park", "Fleming Island", "St Augustine", "Fernandina Beach", "Ponte Vedra"],
    aliases: {},
  },
  {
    id: "617", name: "Milwaukee", state: "WI",
    cities: ["Milwaukee", "Kenosha", "Racine", "Waukesha", "West Allis", "Wauwatosa", "Green Bay"],
    aliases: {},
  },
  {
    id: "825", name: "Honolulu", state: "HI",
    cities: ["Honolulu", "Pearl City", "Kaneohe", "Kailua", "Kailua-Kona", "Hilo", "Lahaina"],
    aliases: {},
  },
  {
    id: "743", name: "Hartford", state: "CT",
    cities: ["Hartford", "New Haven", "Bridgeport", "Stamford", "Waterbury", "Norwalk CT", "Springfield MA"],
    aliases: {},
  },
  {
    id: "566", name: "Oklahoma City", state: "OK",
    cities: ["Oklahoma City", "Tulsa", "Norman OK", "Edmond", "Broken Arrow", "Lawton", "Moore OK"],
    aliases: { "Oklahoma City": "OKC" },
  },
  {
    id: "678", name: "Albuquerque", state: "NM",
    cities: ["Albuquerque", "Rio Rancho", "Santa Fe", "South Valley NM", "Las Cruces"],
    aliases: { "Albuquerque": "ABQ" },
  },
  {
    id: "657", name: "Birmingham", state: "AL",
    cities: ["Birmingham AL", "Huntsville AL", "Montgomery AL", "Hoover", "Tuscaloosa"],
    aliases: {},
  },
  {
    id: "612", name: "Omaha", state: "NE",
    cities: ["Omaha", "Lincoln NE", "Bellevue NE", "Council Bluffs IA", "Papillion", "La Vista NE"],
    aliases: {},
  },
  {
    id: "571", name: "Columbia SC", state: "SC",
    cities: ["Columbia SC", "Lexington SC", "Irmo SC", "Orangeburg SC", "Sumter SC"],
    aliases: {},
  },
  {
    id: "687", name: "El Paso", state: "TX",
    cities: ["El Paso TX", "Ciudad Juárez", "Horizon City", "Socorro TX"],
    aliases: {},
  },
  {
    id: "811", name: "Spokane", state: "WA",
    cities: ["Spokane", "Spokane Valley", "Coeur d'Alene ID", "Post Falls ID"],
    aliases: {},
  },
];

// State lookup helpers
export function getStateByAbbr(abbr: string): UsState | undefined {
  return US_STATES.find((s) => s.abbr.toLowerCase() === abbr.toLowerCase());
}
export function getStateByName(name: string): UsState | undefined {
  return US_STATES.find((s) => s.name.toLowerCase() === name.toLowerCase());
}
export function getDmaById(id: string): DmaMarket | undefined {
  return US_DMAS.find((d) => d.id === id);
}
export function getDmasByState(stateAbbr: string): DmaMarket[] {
  const abbr = stateAbbr.toUpperCase();
  return US_DMAS.filter((d) => d.state === abbr);
}

/** Representative zip codes for each DMA (2-3 per market) */
const DMA_ZIPS: Record<string, string[]> = {
  "501": ["10001", "10036", "11201"],   // New York
  "803": ["90001", "90024", "90210"],   // Los Angeles
  "602": ["60601", "60614", "60629"],   // Chicago
  "504": ["19103", "19107", "19146"],   // Philadelphia
  "506": ["02101", "02116", "02134"],   // Boston
  "807": ["94102", "94110", "94117"],   // San Francisco
  "623": ["75201", "75205", "76102"],   // Dallas
  "618": ["77001", "77002", "77006"],   // Houston
  "511": ["20001", "20003", "20036"],   // Washington DC
  "524": ["30301", "30303", "30309"],   // Atlanta
  "539": ["33602", "33606", "33629"],   // Tampa
  "528": ["33101", "33130", "33139"],   // Miami
  "616": ["55401", "55403", "55415"],   // Minneapolis
  "535": ["44101", "44103", "44114"],   // Cleveland
  "508": ["48201", "48215", "48226"],   // Detroit
  "613": ["85001", "85004", "85013"],   // Phoenix
  "819": ["98101", "98103", "98115"],   // Seattle
  "543": ["23219", "23220", "23230"],   // Richmond
  "527": ["46201", "46204", "46220"],   // Indianapolis
  "533": ["97201", "97209", "97214"],   // Portland
  "561": ["28202", "28203", "28206"],   // Charlotte
  "641": ["92101", "92103", "92115"],   // San Diego
  "752": ["80203", "80205", "80218"],   // Denver
  "544": ["23510", "23517", "23601"],   // Norfolk
  "520": ["21201", "21202", "21218"],   // Baltimore
  "670": ["70112", "70115", "70119"],   // New Orleans
  "532": ["95814", "95816", "95825"],   // Sacramento
  "577": ["45202", "45206", "45219"],   // Cincinnati
  "596": ["64101", "64105", "64108"],   // Kansas City
  "548": ["15201", "15203", "15213"],   // Pittsburgh
  "559": ["84101", "84103", "84111"],   // Salt Lake City
  "650": ["78701", "78704", "78745"],   // Austin
  "685": ["78201", "78205", "78209"],   // San Antonio
  "757": ["37201", "37205", "37215"],   // Nashville
  "563": ["27601", "27605", "27607"],   // Raleigh
  "698": ["89101", "89103", "89121"],   // Las Vegas
  "640": ["38103", "38104", "38120"],   // Memphis
  "636": ["40202", "40204", "40206"],   // Louisville
  "605": ["43201", "43204", "43215"],   // Columbus
  "555": ["32202", "32205", "32207"],   // Jacksonville
  "617": ["53202", "53203", "53211"],   // Milwaukee
  "825": ["96813", "96815", "96817"],   // Honolulu
  "743": ["06101", "06103", "06106"],   // Hartford
  "566": ["73102", "73103", "73112"],   // Oklahoma City
  "678": ["87102", "87104", "87110"],   // Albuquerque
  "657": ["35203", "35205", "35210"],   // Birmingham
  "612": ["68102", "68104", "68131"],   // Omaha
  "571": ["29201", "29203", "29205"],   // Columbia SC
  "687": ["79901", "79902", "79904"],   // El Paso
  "811": ["99201", "99202", "99207"],   // Spokane
};

export function getDmaZips(dmaId: string): string[] {
  return DMA_ZIPS[dmaId] ?? [];
}

// Generate localized keyword variants for a city
export function generateLocalVariants(seed: string, city: string, stateName: string, stateAbbr: string, aliases: Record<string, string>, zipCodes?: string[]): string[] {
  const variants = new Set<string>();
  const cityAlias = aliases[city];
  const cityLower = city.toLowerCase().trim();

  // Core variants: seed + in + city
  variants.add(`${seed} in ${cityLower}`);
  variants.add(`${seed} in ${cityLower} ${stateName.toLowerCase()}`);
  variants.add(`${seed} in ${cityLower} ${stateAbbr.toLowerCase()}`);
  variants.add(`${seed} near ${cityLower}`);
  variants.add(`${seed} ${cityLower}`);

  if (cityAlias) {
    const alias = cityAlias.toLowerCase();
    variants.add(`${seed} in ${alias}`);
    variants.add(`${seed} in ${alias} ${stateAbbr.toLowerCase()}`);
    variants.add(`${seed} ${alias}`);
  }

  for (const zip of (zipCodes ?? []).slice(0, 2)) {
    variants.add(`${seed} ${zip}`);
    variants.add(`${seed} near ${zip}`);
  }

  return [...variants];
}
