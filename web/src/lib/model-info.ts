import type { TumorClass } from "./ai.ts";

export const MODEL_VERSION = "efficientnet-b0-v1";

// Team-reported numbers printed by training/kaggle_train.py (cell 4) in the Kaggle run on 9 Oct 2026 that
// exported ai-service/model/brain_model.onnx. The run log is not stored in this repository.
export const MODEL_METRICS = {
  architecture: "EfficientNet-B0, ImageNet pre-trained, fine-tuned on brain MRI slices",
  dataset: "Brain Tumor MRI Dataset (M. Nickparvar, Kaggle): Training folder for fitting, Testing folder (1,600 images) for evaluation",
  evidence: "Team-reported dataset evaluation from the training notebook run; evaluation log not stored in the repository; not independently verified.",
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
