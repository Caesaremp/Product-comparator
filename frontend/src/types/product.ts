export type ProductCategory = "Monitor" | "Laptop" | "Tastiera" | "Generico";

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
  | "curved";

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
