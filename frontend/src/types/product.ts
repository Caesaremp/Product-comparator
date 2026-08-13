export type ProductCategory =
  | "Monitor"
  | "Laptop"
  | "Tastiera"
  | "Frullatore"
  | "RAM"
  | "Scheda Madre"
  | "CPU"
  | "GPU"
  | "Alimentatore"
  | "Generico";

export type CategoryFieldType = "text" | "number" | "select" | "textarea";

export type SpecKey =
  | "brand"
  | "model"
  | "size"
  | "resolution"
  | "panelType"
  | "refreshRate"
  | "responseTime"
  | "hdr"
  | "ports"
  | "speakers"
  | "adjustable"
  | "vesa"
  | "colorGamut"
  | "energyClass"
  | "cpu"
  | "ram"
  | "storage"
  | "gpu"
  | "screenSize"
  | "screenRes"
  | "battery"
  | "weight"
  | "os"
  | "layout"
  | "switchType"
  | "connection"
  | "backlight"
  | "hotswap"
  | "description"
  | "hdmiPorts"
  | "dpPorts"
  | "usbAPorts"
  | "usbCPorts"
  | "thunderboltPorts"
  | "contrast"
  | "microphone"
  | "webcam"
  | "curved"
  | "power"
  | "rpm"
  | "capacity"
  | "usableCapacity"
  | "travelCupCapacity"
  | "programs"
  | "manualSpeeds"
  | "bladeTechnology"
  | "bladeMaterial"
  | "bladeCount"
  | "jarMaterial"
  | "dishwasherSafe"
  | "bpaFree"
  | "iceCrush"
  | "dimensions"
  | "includedAccessories"
  // RAM
  | "memoryType"
  | "formFactor"
  | "moduleCount"
  | "speed"
  | "casLatency"
  | "voltage"
  | "timings"
  | "xmpProfile"
  | "heatspreader"
  | "rgb"
  | "height"
  | "eccSupport"
  | "warranty"
  // Scheda madre
  | "socket"
  | "chipset"
  | "memorySlots"
  | "maxMemory"
  | "maxMemorySpeed"
  | "vrmPhases"
  | "pcieVersion"
  | "pcieX16Slots"
  | "m2Slots"
  | "sataPorts"
  | "rearUsbPorts"
  | "networking"
  | "wifi"
  | "audioCodec"
  | "biosFlashback"
  | "fanHeaders"
  | "rgbHeaders"
  // CPU
  | "cores"
  | "efficiencyCores"
  | "threads"
  | "baseClock"
  | "boostClock"
  | "l3Cache"
  | "tdp"
  | "maxPower"
  | "lithography"
  | "integratedGraphics"
  | "memorySupport"
  | "pcieLanes"
  | "unlocked"
  | "coolerIncluded"
  | "benchmarkSingle"
  | "benchmarkMulti"
  // GPU
  | "vram"
  | "memoryBus"
  | "memorySpeed"
  | "shadingUnits"
  | "recommendedPsu"
  | "slots"
  | "length"
  | "rayTracing"
  | "upscaling"
  | "fanCount"
  | "benchmark3d"
  // Alimentatore
  | "wattage"
  | "efficiencyRating"
  | "atxVersion"
  | "modular"
  | "fanSize"
  | "fanBearing"
  | "zeroRpm"
  | "pcie5Connectors"
  | "pcieConnectors"
  | "sataConnectors"
  | "protections"
  | "noise"
  | "depth"
  | "japaneseCapacitors";

export type ProductSpecValue = string | number;
export type ProductSpecs = Partial<Record<SpecKey, ProductSpecValue>>;
export type UseCase = string;

export interface ProductReview {
  id: string;
  source: string;
  text: string;
  rating: number;
  count: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: string | number;
  url: string;
  rating: number;
  specs: ProductSpecs;
  useCases: UseCase[];
  reviews: ProductReview[];
  notes: string;
  createdAt: string;
}

export interface CategoryFieldDefinition {
  key: SpecKey;
  label: string;
  type: CategoryFieldType;
  placeholder?: string;
  unit?: string;
  options?: string[];
}
