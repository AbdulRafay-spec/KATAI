import type { TumorClass } from "./ai";

export type ScanStatus = "Awaiting review" | "Signed off" | "Processing";

export type ScanRecord = {
  id: string;
  patientId: string;
  date: string;
  finding: TumorClass;
  confidence: number;
  status: ScanStatus;
  reviewer?: string;
};

// Demo records until scans are stored in a database.
export const SCANS: ScanRecord[] = [
  { id: "SC-2318", patientId: "PT-1042", date: "9 Oct 2026, 11:42", finding: "glioma", confidence: 0.97, status: "Awaiting review" },
  { id: "SC-2317", patientId: "PT-0988", date: "9 Oct 2026, 11:15", finding: "meningioma", confidence: 0.91, status: "Awaiting review" },
  { id: "SC-2316", patientId: "PT-1107", date: "9 Oct 2026, 10:58", finding: "notumor", confidence: 0.99, status: "Signed off", reviewer: "Dr. L. Mammadova" },
  { id: "SC-2315", patientId: "PT-0731", date: "9 Oct 2026, 10:21", finding: "pituitary", confidence: 0.95, status: "Awaiting review" },
  { id: "SC-2314", patientId: "PT-1092", date: "9 Oct 2026, 09:47", finding: "notumor", confidence: 0.98, status: "Signed off", reviewer: "Dr. S. Karimov" },
  { id: "SC-2313", patientId: "PT-0654", date: "8 Oct 2026, 17:30", finding: "glioma", confidence: 0.88, status: "Signed off", reviewer: "Dr. S. Karimov" },
  { id: "SC-2312", patientId: "PT-1120", date: "8 Oct 2026, 16:02", finding: "meningioma", confidence: 0.93, status: "Signed off", reviewer: "Dr. L. Mammadova" },
];

export const PATIENTS = [
  { id: "PT-1042", age: 54, sex: "M", scans: 3, lastScan: "9 Oct 2026", latest: "glioma" as TumorClass },
  { id: "PT-0988", age: 47, sex: "F", scans: 2, lastScan: "9 Oct 2026", latest: "meningioma" as TumorClass },
  { id: "PT-1107", age: 32, sex: "F", scans: 1, lastScan: "9 Oct 2026", latest: "notumor" as TumorClass },
  { id: "PT-0731", age: 61, sex: "M", scans: 4, lastScan: "9 Oct 2026", latest: "pituitary" as TumorClass },
  { id: "PT-1092", age: 28, sex: "M", scans: 1, lastScan: "9 Oct 2026", latest: "notumor" as TumorClass },
  { id: "PT-0654", age: 66, sex: "F", scans: 5, lastScan: "8 Oct 2026", latest: "glioma" as TumorClass },
  { id: "PT-1120", age: 39, sex: "F", scans: 2, lastScan: "8 Oct 2026", latest: "meningioma" as TumorClass },
];

// Results from the Kaggle training run (1,600 held-out test images).
export const MODEL_METRICS = {
  architecture: "EfficientNet-B0 (ImageNet pre-trained, fine-tuned)",
  dataset: "Brain Tumor MRI Dataset (Nickparvar) · 1,600 held-out test images",
  accuracy: 0.957,
  sensitivity: 0.985,
  specificity: 1.0,
  perClass: [
    { cls: "glioma" as TumorClass, precision: 1.0, recall: 0.835, f1: 0.91 },
    { cls: "meningioma" as TumorClass, precision: 0.89, recall: 0.993, f1: 0.939 },
    { cls: "notumor" as TumorClass, precision: 0.957, recall: 1.0, f1: 0.978 },
    { cls: "pituitary" as TumorClass, precision: 0.995, recall: 1.0, f1: 0.998 },
  ],
  classOrder: ["glioma", "meningioma", "notumor", "pituitary"] as TumorClass[],
  confusion: [
    [334, 49, 17, 0],
    [0, 397, 1, 2],
    [0, 0, 400, 0],
    [0, 0, 0, 400],
  ],
};
