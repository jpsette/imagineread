# Especificação de Exportação: Studio → Mobile

## Objetivo

O Mobile App já implementou os modelos Swift para receber quadrinhos animados. Este documento define o **formato JSON exato** que o Studio deve exportar.

---

## Schema JSON Esperado pelo Mobile

### Estrutura Raiz: `StudioProject`

```json
{
  "id": "project-uuid",
  "name": "Nome do Projeto",
  "pages": [...],
  "thumbnailUrl": "https://...",
  "createdAt": "2026-02-02T05:00:00Z",
  "updatedAt": "2026-02-02T05:00:00Z",
  "author": "Nome do Autor",
  "description": "Descrição do projeto"
}
```

### Cada Página: `StudioPage`

```json
{
  "imageUrl": "https://storage.../page_001.png",
  "balloons": [...],
  "panels": [...],
  "pageNumber": 0,
  "originalSize": { "width": 1200, "height": 1800 }
}
```

### Balão: `Balloon`

```json
{
  "id": "balloon-uuid",
  "text": "Texto do balão",
  "box2d": [100, 50, 200, 250],
  "shape": "ellipse",
  "type": "speech",
  
  "points": [
    { "x": 50, "y": 100 },
    { "x": 150, "y": 80 },
    { "x": 250, "y": 100 },
    { "x": 250, "y": 200 },
    { "x": 50, "y": 200 }
  ],
  
  "vertexHandles": [
    { "handleIn": { "x": 40, "y": 105 }, "handleOut": { "x": 60, "y": 95 } },
    { "handleIn": null, "handleOut": null },
    { "handleIn": { "x": 240, "y": 95 }, "handleOut": { "x": 260, "y": 105 } },
    { "handleIn": null, "handleOut": null },
    { "handleIn": null, "handleOut": null }
  ],
  
  "tailTip": { "x": 150, "y": 250 },
  "tailControl": { "x": 150, "y": 220 },
  "tailCurve": 0.5,
  
  "color": "#FFFFFF",
  "borderColor": "#000000",
  "borderWidth": 2.0,
  "opacity": 1.0,
  "textColor": "#000000",
  "fontSize": 14.0,
  "fontFamily": "System",
  
  "rotation": 0.0,
  "scaleX": 1.0,
  "scaleY": 1.0,
  
  "animationDelay": 0.3,
  "animationDuration": 0.4,
  "animationType": "fadeIn"
}
```

### Painel: `Panel`

```json
{
  "id": "panel-uuid",
  "order": 0,
  "points": [0, 0, 300, 0, 300, 400, 0, 400],
  "box2d": [0, 0, 400, 300]
}
```

---

## Campos Obrigatórios vs Opcionais

### StudioProject
| Campo | Obrigatório | Tipo |
|-------|-------------|------|
| `id` | ✅ | String |
| `name` | ✅ | String |
| `pages` | ✅ | StudioPage[] |
| `thumbnailUrl` | ❌ | String? |
| `createdAt` | ❌ | ISO8601 Date? |
| `updatedAt` | ❌ | ISO8601 Date? |
| `author` | ❌ | String? |
| `description` | ❌ | String? |

### StudioPage
| Campo | Obrigatório | Tipo |
|-------|-------------|------|
| `imageUrl` | ✅ | String |
| `balloons` | ✅ | Balloon[] |
| `panels` | ✅ | Panel[] |
| `pageNumber` | ❌ | Int? |
| `originalSize` | ❌ | { width, height }? |

### Balloon
| Campo | Obrigatório | Tipo |
|-------|-------------|------|
| `id` | ✅ | String |
| `text` | ✅ | String |
| `box2d` | ✅ | [ymin, xmin, ymax, xmax] |
| `shape` | ✅ | "rectangle" \| "ellipse" \| "cloud" \| "scream" \| "custom" |
| `type` | ✅ | "speech" \| "thought" \| "whisper" \| "shout" \| "text" \| "shape" \| "mask" |
| `points` | ❌ | CGPoint[]? |
| `vertexHandles` | ❌ | VertexHandle[]? |
| `tailTip` | ❌ | CGPoint? |
| `tailControl` | ❌ | CGPoint? |
| `color` | ❌ | String (hex)? |
| `borderColor` | ❌ | String (hex)? |
| `borderWidth` | ❌ | CGFloat? |
| `opacity` | ❌ | CGFloat (0-1)? |
| `animationDelay` | ❌ | TimeInterval? |
| `animationDuration` | ❌ | TimeInterval? |
| `animationType` | ❌ | String? |

### Panel
| Campo | Obrigatório | Tipo |
|-------|-------------|------|
| `id` | ✅ | String |
| `order` | ✅ | Int |
| `points` | ✅ | [x1, y1, x2, y2, ...] |
| `box2d` | ✅ | [ymin, xmin, ymax, xmax] |

---

## Mapeamento Studio → Export

O Studio já tem o modelo `Balloon` em `shared/types/index.ts`. Veja o mapeamento:

| Studio (TypeScript) | Export JSON | Mobile (Swift) |
|---------------------|-------------|----------------|
| `Balloon.id` | `id` | `Balloon.id` |
| `Balloon.text` | `text` | `Balloon.text` |
| `Balloon.box_2d` | `box2d` | `Balloon.box2d` |
| `Balloon.shape` | `shape` | `Balloon.shape` |
| `Balloon.type` | `type` | `Balloon.type` |
| `Balloon.points` | `points` (convert to {x,y}[]) | `Balloon.points` |
| `Balloon.vertexHandles` | `vertexHandles` | `Balloon.vertexHandles` |
| `Balloon.tailTip` | `tailTip` | `Balloon.tailTip` |
| `Balloon.tailControl` | `tailControl` | `Balloon.tailControl` |
| `Balloon.color` | `color` | `Balloon.color` |
| `Balloon.borderColor` | `borderColor` | `Balloon.borderColor` |
| `Balloon.borderWidth` | `borderWidth` | `Balloon.borderWidth` |
| `Balloon.opacity` | `opacity` | `Balloon.opacity` |
| `Balloon.rotation` | `rotation` | `Balloon.rotation` |
| `Balloon.scaleX` | `scaleX` | `Balloon.scaleX` |
| `Balloon.scaleY` | `scaleY` | `Balloon.scaleY` |

---

## Implementação no Studio

### 1. Criar função de exportação

```typescript
// features/editor/utils/exportForMobile.ts

interface MobileExport {
  id: string;
  name: string;
  pages: MobilePage[];
  thumbnailUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  description?: string;
}

interface MobilePage {
  imageUrl: string;
  balloons: MobileBalloon[];
  panels: MobilePanel[];
  pageNumber?: number;
  originalSize?: { width: number; height: number };
}

interface MobileBalloon {
  id: string;
  text: string;
  box2d: number[];
  shape: string;
  type: string;
  points?: { x: number; y: number }[];
  vertexHandles?: { handleIn?: { x: number; y: number }; handleOut?: { x: number; y: number } }[];
  tailTip?: { x: number; y: number };
  tailControl?: { x: number; y: number };
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  fontSize?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  animationDelay?: number;
  animationDuration?: number;
  animationType?: string;
}

interface MobilePanel {
  id: string;
  order: number;
  points: number[];
  box2d: number[];
}

export function exportForMobile(
  projectId: string,
  projectName: string,
  files: FileEntry[]
): MobileExport {
  return {
    id: projectId,
    name: projectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: files
      .filter(f => f.type === 'file' && f.url)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((file, index) => ({
        imageUrl: file.cleanUrl || file.url,
        pageNumber: index,
        balloons: (file.balloons || []).map(convertBalloon),
        panels: (file.panels || []).map(convertPanel),
      })),
  };
}

function convertBalloon(b: Balloon, index: number): MobileBalloon {
  return {
    id: b.id,
    text: b.text || '',
    box2d: b.box_2d,
    shape: b.shape,
    type: b.type,
    points: b.points?.map(p => ({ x: p.x, y: p.y })),
    vertexHandles: b.vertexHandles?.map(h => ({
      handleIn: h.handleIn ? { x: h.handleIn.x, y: h.handleIn.y } : undefined,
      handleOut: h.handleOut ? { x: h.handleOut.x, y: h.handleOut.y } : undefined,
    })),
    tailTip: b.tailTip ? { x: b.tailTip.x, y: b.tailTip.y } : undefined,
    tailControl: b.tailControl ? { x: b.tailControl.x, y: b.tailControl.y } : undefined,
    color: b.color,
    borderColor: b.borderColor,
    borderWidth: b.borderWidth,
    opacity: b.opacity,
    fontSize: b.fontSize,
    rotation: b.rotation,
    scaleX: b.scaleX,
    scaleY: b.scaleY,
    animationDelay: 0.3 * index,
    animationDuration: 0.4,
    animationType: 'fadeIn',
  };
}

function convertPanel(p: Panel): MobilePanel {
  return {
    id: p.id,
    order: p.order,
    points: p.points,
    box2d: p.box_2d,
  };
}
```

### 2. Adicionar opção no ExportModal

No `ExportModal.tsx`, adicionar um novo botão:

```tsx
// Opção 4: Mobile JSON
<button
  disabled={!!loading}
  onClick={() => handleExportMobile()}
  className="group relative flex flex-col items-start p-6 rounded-xl border border-[#27272a] ..."
>
  <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 ...">
    <Smartphone size={24} />
  </div>
  <h3 className="font-bold text-white mb-1">Mobile Package</h3>
  <p className="text-xs text-zinc-400 ...">
    Pacote JSON para ImagineRead App com balões vetorizados e animações.
  </p>
</button>
```

### 3. Gerar arquivo ZIP

O pacote final deve ser um ZIP contendo:
```
project_name/
├── project.json        # StudioProject JSON
└── images/
    ├── page_001.png    # Imagens limpas
    ├── page_002.png
    └── ...
```

---

## Exemplo Completo de Output

```json
{
  "id": "abc123",
  "name": "Meu Quadrinho",
  "pages": [
    {
      "imageUrl": "images/page_001.png",
      "pageNumber": 0,
      "originalSize": { "width": 1200, "height": 1800 },
      "balloons": [
        {
          "id": "b1",
          "text": "Olá!",
          "box2d": [100, 50, 180, 200],
          "shape": "ellipse",
          "type": "speech",
          "color": "#FFFFFF",
          "borderColor": "#000000",
          "borderWidth": 2,
          "animationDelay": 0,
          "animationDuration": 0.4,
          "animationType": "fadeIn"
        },
        {
          "id": "b2",
          "text": "Tudo bem?",
          "box2d": [250, 100, 350, 280],
          "shape": "ellipse",
          "type": "speech",
          "points": [
            { "x": 100, "y": 250 },
            { "x": 200, "y": 250 },
            { "x": 280, "y": 300 },
            { "x": 200, "y": 350 },
            { "x": 100, "y": 350 }
          ],
          "vertexHandles": [
            { "handleOut": { "x": 120, "y": 240 } },
            { "handleIn": { "x": 180, "y": 240 } },
            null,
            null,
            { "handleIn": { "x": 80, "y": 340 } }
          ],
          "tailTip": { "x": 280, "y": 380 },
          "tailControl": { "x": 260, "y": 360 },
          "color": "#FFFFFF",
          "borderColor": "#000000",
          "animationDelay": 0.3,
          "animationDuration": 0.4,
          "animationType": "fadeIn"
        }
      ],
      "panels": [
        {
          "id": "p1",
          "order": 0,
          "points": [0, 0, 600, 0, 600, 450, 0, 450],
          "box2d": [0, 0, 450, 600]
        },
        {
          "id": "p2",
          "order": 1,
          "points": [0, 450, 600, 450, 600, 900, 0, 900],
          "box2d": [450, 0, 900, 600]
        }
      ]
    }
  ],
  "createdAt": "2026-02-02T05:30:00Z",
  "author": "JP Sette"
}
```

---

## Checklist para o Studio

- [ ] Criar `exportForMobile.ts` com funções de conversão
- [ ] Adicionar botão "Mobile Package" no ExportModal
- [ ] Gerar ZIP com `project.json` + `images/`
- [ ] Calcular `animationDelay` baseado na ordem dos balões
- [ ] Garantir que `box2d` está no formato `[ymin, xmin, ymax, xmax]`
- [ ] Converter `points` de `{x, y}[]` para array JSON
- [ ] Testar importação no Mobile App
