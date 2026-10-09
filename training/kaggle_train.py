# Paste each "# %%" block into its own Kaggle notebook cell, then Run All.

# %% 1. Install export tools
!pip install -q onnx onnxscript onnxruntime

# %% 2. Load the dataset
import glob, os, json, torch, torch.nn as nn, numpy as np
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, Subset
from sklearn.metrics import classification_report, confusion_matrix

train_dir = [p for p in glob.glob('/kaggle/input/**/Training', recursive=True) if os.path.isdir(p)][0]
test_dir = os.path.join(os.path.dirname(train_dir), 'Testing')
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print('Data:', train_dir, '| Device:', device)

norm = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
train_tf = transforms.Compose([
    transforms.Resize((224, 224)), transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10), transforms.ColorJitter(0.2, 0.2),
    transforms.ToTensor(), norm])
eval_tf = transforms.Compose([transforms.Resize((224, 224)), transforms.ToTensor(), norm])

full_train = datasets.ImageFolder(train_dir, train_tf)
full_val = datasets.ImageFolder(train_dir, eval_tf)
test_ds = datasets.ImageFolder(test_dir, eval_tf)
classes = full_train.classes
print('Classes:', classes)

idx = torch.randperm(len(full_train), generator=torch.Generator().manual_seed(42)).tolist()
cut = int(0.85 * len(idx))
train_dl = DataLoader(Subset(full_train, idx[:cut]), batch_size=32, shuffle=True, num_workers=2)
val_dl = DataLoader(Subset(full_val, idx[cut:]), batch_size=64, num_workers=2)
test_dl = DataLoader(test_ds, batch_size=64, num_workers=2)

# %% 3. Train (pre-trained EfficientNet-B0, fine-tuned on brain MRIs)
model = models.efficientnet_b0(weights='IMAGENET1K_V1')
model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(classes))
model = model.to(device)
opt = torch.optim.AdamW(model.parameters(), lr=3e-4)
loss_fn = nn.CrossEntropyLoss()

def predict(dl):
    model.eval(); ys, ps = [], []
    with torch.no_grad():
        for x, y in dl:
            ps += model(x.to(device)).argmax(1).cpu().tolist(); ys += y.tolist()
    return np.array(ys), np.array(ps)

best = 0
for epoch in range(10):
    model.train()
    for x, y in train_dl:
        opt.zero_grad()
        loss = loss_fn(model(x.to(device)), y.to(device))
        loss.backward(); opt.step()
    ys, ps = predict(val_dl)
    acc = (ys == ps).mean()
    print(f'Epoch {epoch + 1}: val accuracy {acc:.3f}')
    if acc > best:
        best = acc; torch.save(model.state_dict(), 'best.pt')

# %% 4. Test on images the model has never seen
model.load_state_dict(torch.load('best.pt'))
ys, ps = predict(test_dl)
print(classification_report(ys, ps, target_names=classes, digits=3))
print(confusion_matrix(ys, ps))

healthy = classes.index('notumor')
true_tumor, pred_tumor = ys != healthy, ps != healthy
print(f'Tumor sensitivity (tumors caught): {(true_tumor & pred_tumor).sum() / true_tumor.sum():.3f}')
print(f'Specificity (healthy cleared):    {(~true_tumor & ~pred_tumor).sum() / (~true_tumor).sum():.3f}')

# %% 5. Export the model file for the AI service
model = model.cpu().eval()
torch.onnx.export(model, torch.randn(1, 3, 224, 224), '/kaggle/working/brain_model.onnx',
                  input_names=['input'], output_names=['logits'], external_data=False)
json.dump(classes, open('/kaggle/working/labels.json', 'w'))

import onnxruntime as ort
out = ort.InferenceSession('/kaggle/working/brain_model.onnx').run(None, {'input': np.random.rand(1, 3, 224, 224).astype('float32')})
print('ONNX check OK, output shape:', out[0].shape)
