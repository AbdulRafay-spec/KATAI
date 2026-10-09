# Demo sample MRIs

Add only de-identified images the team is allowed to redistribute. For each image:

1. Put the file in this folder (JPG/PNG/WEBP/BMP, max 4 MB).
2. Add an entry to `manifest.json`:

```json
{
  "samples": [
    {
      "id": "glioma-01",
      "file": "/samples/glioma-01.jpg",
      "title": "Axial slice A",
      "referenceLabel": "glioma",
      "source": "Brain Tumor MRI Dataset (M. Nickparvar), Testing/glioma/Te-gl_0010.jpg",
      "license": "<license as stated on the dataset page>"
    }
  ]
}
```

`referenceLabel` is the dataset's folder label (`glioma`, `meningioma`, `pituitary`, `notumor`) or `null`.
The app shows it next to the live model prediction and never replaces the prediction with it.
Entries without `source` and `license` are ignored.
