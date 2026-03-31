import type { CategoryFieldDefinition, ProductCategory, UseCase } from "../types/product";

export const CATEGORY_FIELDS: Record<ProductCategory, CategoryFieldDefinition[]> = {
  Monitor: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "model", label: "Modello", type: "text" },
    { key: "size", label: 'Pollici (")', type: "number", unit: '"' },
    { key: "resolution", label: "Risoluzione", type: "text", placeholder: "es. 3840x2160" },
    { key: "panelType", label: "Pannello", type: "select", options: ["IPS", "VA", "TN", "OLED", "Mini-LED", "QD-OLED"] },
    { key: "refreshRate", label: "Refresh Rate", type: "number", unit: "Hz" },
    { key: "responseTime", label: "Tempo Risposta", type: "number", unit: "ms" },
    { key: "hdr", label: "HDR", type: "select", options: ["No", "HDR10", "HDR400", "HDR600", "HDR1000", "HDR1400", "Dolby Vision"] },
    { key: "ports", label: "Porte", type: "text", placeholder: "es. 2xHDMI, 1xDP, USB-C" },
    { key: "speakers", label: "Speaker integrati", type: "select", options: ["Sì", "No"] },
    { key: "adjustable", label: "Stand regolabile", type: "select", options: ["Sì", "No", "Solo tilt"] },
    { key: "vesa", label: "VESA", type: "select", options: ["Sì", "No"] },
    { key: "colorGamut", label: "Gamut colore", type: "text", placeholder: "es. 100% sRGB, 95% DCI-P3" },
    { key: "energyClass", label: "Classe energetica", type: "text" },
  ],
  Laptop: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "model", label: "Modello", type: "text" },
    { key: "cpu", label: "CPU", type: "text" },
    { key: "ram", label: "RAM", type: "number", unit: "GB" },
    { key: "storage", label: "Storage", type: "text", placeholder: "es. 512GB SSD" },
    { key: "gpu", label: "GPU", type: "text" },
    { key: "screenSize", label: "Schermo", type: "number", unit: '"' },
    { key: "screenRes", label: "Risoluzione", type: "text" },
    { key: "battery", label: "Batteria", type: "text", placeholder: "es. 72Wh" },
    { key: "weight", label: "Peso", type: "number", unit: "kg" },
    { key: "os", label: "OS", type: "text" },
  ],
  Tastiera: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "model", label: "Modello", type: "text" },
    { key: "layout", label: "Layout", type: "select", options: ["IT", "US", "UK", "DE", "Custom"] },
    { key: "switchType", label: "Switch", type: "text", placeholder: "es. Cherry MX Brown" },
    { key: "connection", label: "Connessione", type: "select", options: ["USB", "Bluetooth", "2.4GHz", "Multi-device"] },
    { key: "backlight", label: "Retroilluminazione", type: "select", options: ["No", "Singolo colore", "RGB"] },
    { key: "hotswap", label: "Hot-swap", type: "select", options: ["Sì", "No"] },
    { key: "size", label: "Formato", type: "select", options: ["Full-size", "TKL", "75%", "65%", "60%", "40%"] },
  ],
  Generico: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "model", label: "Modello", type: "text" },
    { key: "description", label: "Descrizione", type: "textarea" },
  ],
};

export const USE_CASES: Record<ProductCategory, UseCase[]> = {
  Monitor: ["Gaming", "Produttività", "Grafica/Video", "Ufficio", "Streaming", "Programmazione"],
  Laptop: ["Gaming", "Produttività", "Sviluppo", "Portatile/Viaggio", "Creatività"],
  Tastiera: ["Gaming", "Typing", "Programmazione", "Ufficio", "Portatile"],
  Generico: ["Uso quotidiano", "Professionale", "Hobby"],
};

export const CATEGORIES = Object.keys(CATEGORY_FIELDS) as ProductCategory[];
