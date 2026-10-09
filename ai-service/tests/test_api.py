"""Run from ai-service/: python -m unittest discover tests  (needs requirements-dev.txt)."""
import io
import sys
import unittest
from pathlib import Path

import numpy as np
from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from main import app  # noqa: E402

client = TestClient(app)
CLASSES = {"glioma", "meningioma", "notumor", "pituitary"}


def image_bytes(fmt="PNG", size=(256, 256)):
    buf = io.BytesIO()
    Image.fromarray((np.random.default_rng(0).random((size[1], size[0])) * 255).astype("uint8")).save(buf, fmt)
    return buf.getvalue()


def post(data, name="x.png", ctype="image/png"):
    return client.post("/predict", files={"file": (name, data, ctype)})


class PredictTests(unittest.TestCase):
    def test_health_identifies_classifier(self):
        body = client.get("/").json()
        self.assertEqual(set(body["classes"]), CLASSES)

    def test_valid_image_returns_contract(self):
        r = post(image_bytes())
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn(body["prediction"], CLASSES)
        self.assertEqual(set(body["scores"]), CLASSES)
        self.assertAlmostEqual(sum(body["scores"].values()), 1.0, places=2)
        self.assertEqual(body["confidence"], body["scores"][body["prediction"]])
        self.assertEqual(body["tumor_detected"], body["prediction"] != "notumor")

    def test_jpeg_accepted(self):
        self.assertEqual(post(image_bytes("JPEG"), "x.jpg", "image/jpeg").status_code, 200)

    def test_oversized_rejected(self):
        self.assertEqual(post(b"0" * (4 * 1024 * 1024 + 1)).status_code, 413)

    def test_empty_rejected(self):
        self.assertEqual(post(b"").status_code, 400)

    def test_not_an_image_rejected_despite_extension(self):
        self.assertEqual(post(b"this is text", "fake.png").status_code, 400)

    def test_corrupt_image_rejected(self):
        self.assertEqual(post(image_bytes()[:200]).status_code, 400)

    def test_unsupported_format_rejected(self):
        self.assertEqual(post(image_bytes("GIF"), "x.gif", "image/gif").status_code, 415)

    def test_huge_dimensions_rejected(self):
        buf = io.BytesIO()
        Image.new("L", (5000, 10)).save(buf, "PNG")
        self.assertEqual(post(buf.getvalue()).status_code, 413)


if __name__ == "__main__":
    unittest.main()
