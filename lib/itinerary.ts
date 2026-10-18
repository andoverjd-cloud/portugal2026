export interface Stop {
  time?: string;
  name: string;
  description: string;
  url?: string;
  address?: string;
  lat?: number;
  lng?: number;
  confirmed?: string;
  tags?: string[];
  type: "hotel" | "activity" | "travel" | "meal";
}

export interface Region {
  name: string;
  description: string;
  color: string;
}

export interface Day {
  id: string;
  date: string;
  label: string;
  subtitle?: string;
  stops: Stop[];
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
  regions: Region[];
}

export const hotels = {
  sixSenses: {
    name: "Six Senses Douro Valley",
    url: "https://www.sixsenses.com/en/resorts/douro-valley",
  },
  barrocal: {
    name: "São Lourenço do Barrocal",
    url: "https://barrocal.pt/en/",
  },
  malhadinha: {
    name: "Herdade da Malhadinha Nova",
    url: "https://www.malhadinhanova.pt/en/",
  },
  ivens: {
    name: "The Ivens Hotel, Lisbon",
    url: "https://www.theivens.com/",
  },
};

export const days: Day[] = [
  {
    id: "sunday",
    date: "October 18, 2026",
    label: "Sunday",
    subtitle: "Arrival — Lisbon to the Douro Valley",
    mapCenter: { lat: 41.1, lng: -7.9 },
    mapZoom: 10,
    regions: [
      { name: "Lisbon Airport", description: "Clear customs, collect rental car", color: "#c4622d" },
      { name: "Douro Valley", description: "One of the world's oldest demarcated wine regions — terraced vineyards along the Douro River", color: "#1a3a5c" },
    ],
    stops: [
      {
        time: "10:45 AM",
        name: "Land at Lisbon Airport",
        description: "Clear customs and collect the rental car.",
        confirmed: "Avis #22409792US6",
        type: "travel",
      },
      {
        time: "12:00 PM",
        name: "Drive to Six Senses Douro Valley",
        description: "Scenic ~4 hour drive northeast through the heart of Portugal into the Douro wine country.",
        type: "travel",
      },
      {
        time: "4:00 PM",
        name: "Six Senses Douro Valley",
        description: "Arrive and settle into our suite at this extraordinary hilltop retreat overlooking the river.",
        address: "Quinta de Vale Abraão, Samodães, 5100-758 Lamego, Portugal",
        lat: 41.0881,
        lng: -7.9064,
        url: "https://www.sixsenses.com/en/resorts/douro-valley",
        type: "hotel",
      },
      {
        time: "6:00 PM",
        name: "Local Wine Tasting",
        description: "Introduction to the Douro's celebrated varietals — a perfect first evening in wine country.",
        type: "activity",
      },
      {
        time: "7:30 PM",
        name: "DOC Restaurant",
        description: "Michelin-recommended dinner at DOC, Chef Rui Paula's celebrated riverside restaurant in Folgosa — one of the Douro Valley's finest tables. Perched directly on the river with a stunning terrace, DOC blends contemporary technique with the chef's Trás-os-Montes roots, drawing on local produce and an exceptional Douro wine list. Tasting menus and à la carte available.",
        address: "Cais da Folgosa, Estrada Nacional 222, Folgosa, Portugal",
        url: "https://www.ruipaula.com/en/restaurants/doc",
        type: "meal",
      },
    ],
  },
  {
    id: "monday",
    date: "October 19, 2026",
    label: "Monday",
    subtitle: "Douro Valley — Explore, Tastings & Dinner",
    mapCenter: { lat: 41.1, lng: -7.9 },
    mapZoom: 10,
    regions: [
      { name: "Six Senses Estate", description: "Town exploration, resort tastings, and an evening on property", color: "#1a3a5c" },
    ],
    stops: [
      {
        time: "Morning",
        name: "Breakfast & Explore the Town",
        description: "Morning breakfast at the resort followed by time exploring the local village and surroundings.",
        type: "activity",
        tags: ["Breakfast"],
      },
      {
        time: "3:30 PM",
        name: "Port Wine & Chocolates Tasting",
        description: "Indulgent tasting of Port wines paired with artisan chocolates at the resort.",
        type: "activity",
      },
      {
        time: "5:00 PM",
        name: "Pickling Class",
        description: "Hands-on pickling class at the resort — a fun dive into traditional Portuguese preservation techniques.",
        type: "activity",
      },
      {
        time: "7:00 PM",
        name: "The Vale de Abraão Restaurant",
        description: "Dinner at the resort's intimate restaurant — relaxed and elegant.",
        type: "meal",
      },
    ],
  },
  {
    id: "tuesday",
    date: "October 20, 2026",
    label: "Tuesday",
    subtitle: "Douro Valley — Hike, Port & Farewell Dinner",
    mapCenter: { lat: 41.1, lng: -7.9 },
    mapZoom: 10,
    regions: [
      { name: "Six Senses Estate", description: "Morning hike through the estate trails", color: "#1a3a5c" },
      { name: "Douro Valley", description: "Walk and Taste Port Knox — an afternoon port experience", color: "#c4622d" },
    ],
    stops: [
      {
        time: "9:00 AM",
        name: "Personal Hike",
        description: "Morning hike through the estate vineyards and surrounding hillsides.",
        type: "activity",
      },
      {
        time: "12:00 PM",
        name: "Lunch",
        description: "Lunch at the resort.",
        type: "meal",
        tags: ["Lunch"],
      },
      {
        time: "3:30 PM",
        name: "Wine Tasting with Cheeses",
        description: "Curated tasting of Douro Valley wines paired with local Portuguese cheeses at the resort.",
        type: "activity",
      },
      {
        time: "7:00 PM",
        name: "Cozinha do Douro",
        description: "Final dinner at Six Senses — Cozinha do Douro celebrates the rustic flavours of the valley.",
        type: "meal",
      },
    ],
  },
  {
    id: "wednesday",
    date: "October 21, 2026",
    label: "Wednesday",
    subtitle: "Into the Alentejo — São Lourenço do Barrocal",
    mapCenter: { lat: 38.55, lng: -7.35 },
    mapZoom: 10,
    regions: [
      { name: "Alentejo", description: "Portugal's vast interior — rolling plains, cork oaks, and ancient estates", color: "#1a3a5c" },
      { name: "Monsaraz", description: "Medieval hilltop village overlooking the Alqueva reservoir", color: "#c4622d" },
    ],
    stops: [
      {
        time: "8:00 AM",
        name: "Breakfast at Six Senses",
        description: "Farewell breakfast before the drive south.",
        type: "meal",
        tags: ["Breakfast"],
      },
      {
        time: "9:00 AM",
        name: "Drive to São Lourenço do Barrocal",
        description: "Scenic ~4 hour drive south through Portugal's interior into the heart of the Alentejo.",
        type: "travel",
      },
      {
        time: "1:00 PM",
        name: "São Lourenço do Barrocal",
        description: "Arrive at this extraordinary 780-hectare working estate — a restored 19th-century agricultural hamlet transformed into a singular hotel.",
        address: "Herdade do Barrocal, 7200-177 Monsaraz, Portugal",
        lat: 38.4558,
        lng: -7.3827,
        url: "https://barrocal.pt/en/",
        type: "hotel",
      },
      {
        time: "5:00 PM",
        name: "Jeep Tour of the Estate",
        description: "Off-road exploration of the 780-hectare estate — cork oaks, olive groves, vineyards, and the Alqueva lake.",
        type: "activity",
      },
      {
        time: "6:30 PM",
        name: "Dinner at Barrocal",
        description: "Dinner at the main restaurant — seasonal Alentejo cuisine anchored by the estate's own produce, wine, and olive oil.",
        type: "meal",
      },
    ],
  },
  {
    id: "thursday",
    date: "October 22, 2026",
    label: "Thursday",
    subtitle: "Alentejo — Olive Oil, Wine & Off-Property Dinner",
    mapCenter: { lat: 38.55, lng: -7.35 },
    mapZoom: 10,
    regions: [
      { name: "São Lourenço do Barrocal", description: "Estate tastings — olive oil and vertical wine", color: "#1a3a5c" },
      { name: "Reguengos de Monsaraz", description: "Nearby town — dinner at SAHIDA restaurant", color: "#c4622d" },
    ],
    stops: [
      {
        time: "11:30 AM",
        name: "Olive Oil Tasting",
        description: "Guided tasting of the estate's award-winning olive oils — a Barrocal signature experience.",
        type: "activity",
      },
      {
        time: "4:00 PM",
        name: "Vertical Wine Tasting",
        description: "Vertical tasting of Barrocal wines across multiple vintages.",
        type: "activity",
      },
      {
        time: "6:30 PM",
        name: "Drive to Dinner",
        description: "Short drive to Reguengos de Monsaraz.",
        type: "travel",
      },
      {
        time: "7:00 PM",
        name: "SAHIDA",
        description: "Contemporary Alentejo cuisine in a beautifully restored space in Reguengos de Monsaraz.",
        address: "R. José Fernandes Caeiro 5, 7200-175 Reguengos de Monsaraz, Portugal",
        lat: 38.4203,
        lng: -7.5381,
        type: "meal",
      },
    ],
  },
  {
    id: "friday",
    date: "October 23, 2026",
    label: "Friday",
    subtitle: "Alentejo — Malhadinha Nova",
    mapCenter: { lat: 37.96, lng: -7.98 },
    mapZoom: 10,
    regions: [
      { name: "São Lourenço do Barrocal", description: "Morning farewell to the estate", color: "#c4622d" },
      { name: "Herdade da Malhadinha Nova", description: "Southern Alentejo — acclaimed wines near Beja", color: "#1a3a5c" },
    ],
    stops: [
      {
        time: "Morning",
        name: "Relax at Barrocal",
        description: "Final morning at the estate before heading south.",
        type: "activity",
      },
      {
        time: "2:00 PM",
        name: "Drive to Herdade da Malhadinha Nova",
        description: "~1.5 hour drive south through the lower Alentejo plains.",
        type: "travel",
      },
      {
        time: "3:30 PM",
        name: "Herdade da Malhadinha Nova",
        description: "Arrive at this family-run wine estate near Beja — elegant rooms, acclaimed wines, and one of the best restaurants in the Alentejo.",
        address: "Herdade da Malhadinha Nova, 7800-601 Albernoa, Portugal",
        lat: 37.9631,
        lng: -7.9856,
        url: "https://www.malhadinhanova.pt/en/",
        type: "hotel",
      },
      {
        time: "7:00 PM",
        name: "Casa do Alentejo — Casa Verde",
        description: "Dinner at Malhadinha Nova's fine dining restaurant — celebrated for its Alentejano tasting menus and exceptional estate wines.",
        type: "meal",
      },
    ],
  },
  {
    id: "saturday",
    date: "October 24, 2026",
    label: "Saturday",
    subtitle: "Malhadinha Nova — A Day on the Estate",
    mapCenter: { lat: 37.96, lng: -7.98 },
    mapZoom: 11,
    regions: [
      { name: "Herdade da Malhadinha Nova", description: "A full day exploring the estate and its wines", color: "#1a3a5c" },
    ],
    stops: [
      {
        time: "Morning",
        name: "Morning on the Estate",
        description: "Explore the vineyards, olive groves, and grounds at your own pace.",
        type: "activity",
      },
      {
        time: "7:00 PM",
        name: "Casa do Alentejo — Casa Verde",
        description: "Another evening at the estate restaurant.",
        type: "meal",
      },
    ],
  },
  {
    id: "sunday-lisbon",
    date: "October 25, 2026",
    label: "Sunday",
    subtitle: "Lisbon — The Ivens",
    mapCenter: { lat: 38.72, lng: -9.14 },
    mapZoom: 11,
    regions: [
      { name: "Herdade da Malhadinha Nova", description: "Morning farewell to the Alentejo", color: "#c4622d" },
      { name: "Lisbon", description: "The capital — historic, vibrant, and the perfect final chapter", color: "#1a3a5c" },
    ],
    stops: [
      {
        time: "Morning",
        name: "Morning at Malhadinha Nova",
        description: "Final morning in the Alentejo — breakfast and a walk through the vineyards.",
        type: "activity",
      },
      {
        time: "2:00 PM",
        name: "Drive to Lisbon",
        description: "~2 hour drive west to Lisbon.",
        type: "travel",
      },
      {
        time: "4:00 PM",
        name: "The Ivens Hotel",
        description: "Check in to The Ivens — a stylish boutique hotel in the heart of Lisbon's Chiado neighbourhood.",
        address: "Rua Ivens 10, 1200-226 Lisboa, Portugal",
        lat: 38.7104,
        lng: -9.1413,
        url: "https://www.theivens.com/",
        type: "hotel",
      },
      {
        time: "6:30 PM",
        name: "Gastro Bar at the Ivens",
        description: "Evening cocktails and bites at the hotel's stylish gastro bar.",
        type: "meal",
      },
    ],
  },
  {
    id: "monday-lisbon",
    date: "October 26, 2026",
    label: "Monday",
    subtitle: "Lisbon — Last Day",
    mapCenter: { lat: 38.72, lng: -9.14 },
    mapZoom: 13,
    regions: [
      { name: "Lisbon", description: "Chiado, Alfama, and the city at its finest", color: "#1a3a5c" },
    ],
    stops: [
      {
        time: "Morning",
        name: "Explore Lisbon",
        description: "A final morning wandering Chiado, Bairro Alto, or the Alfama — trams, tiles, and pastéis de nata.",
        type: "activity",
      },
      {
        time: "Afternoon",
        name: "Fly Home",
        description: "Return flight to Boston.",
        type: "travel",
      },
    ],
  },
];
