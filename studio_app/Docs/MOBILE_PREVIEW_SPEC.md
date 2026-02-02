# Especificação: Mobile Preview no Studio

## Objetivo

Implementar um componente `<MobilePreview />` no Studio que **replica visualmente o leitor do Mobile App**, permitindo visualizar como os quadrinhos com balões animados serão exibidos no app iOS.

---

## Referência: Comportamento do Mobile

### Estrutura do Leitor iOS

```
ReaderView
├── pageContent (horizontal/vertical/oriental)
│   └── PageView (imagem da página)
│       └── BalloonOverlay[] (balões vetorizados)
├── controlsOverlay (topBar + bottomBar)
└── NightModeOverlay
```

### Modos de Leitura
| Modo | Navegação | Descrição |
|------|-----------|-----------|
| `horizontal` | Swipe → | Esquerda para direita |
| `oriental` | Swipe ← | Direita para esquerda (mangá) |
| `vertical` | Scroll ↓ | Scroll contínuo (webtoon) |

### Animações de Balões
- **Entrada:** Scale de 0.5 → 1.0 + opacity 0 → 1
- **Timing:** `spring(response: 0.4, dampingFraction: 0.7)`
- **Delay sequencial:** Cada balão aparece 0.3s após o anterior

---

## Componentes React a Implementar

### 1. `<MobilePreview />`

Container principal que simula a tela do iPhone.

```tsx
// features/editor/components/MobilePreview.tsx

interface MobilePreviewProps {
  pages: StudioPage[];
  currentPageIndex: number;
  onPageChange?: (index: number) => void;
  readingMode?: 'horizontal' | 'oriental' | 'vertical';
  showControls?: boolean;
  autoPlayAnimations?: boolean;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({
  pages,
  currentPageIndex,
  onPageChange,
  readingMode = 'horizontal',
  showControls = true,
  autoPlayAnimations = true
}) => {
  return (
    <div className="mobile-preview-container">
      {/* iPhone frame */}
      <div className="iphone-frame">
        <div className="iphone-notch" />
        <div className="iphone-screen">
          <PageViewer
            page={pages[currentPageIndex]}
            autoPlay={autoPlayAnimations}
          />
          {showControls && (
            <PreviewControls
              currentPage={currentPageIndex}
              totalPages={pages.length}
              onPageChange={onPageChange}
            />
          )}
        </div>
        <div className="iphone-home-indicator" />
      </div>
    </div>
  );
};
```

### 2. `<PageViewer />`

Renderiza uma página com imagem + balões.

```tsx
// features/editor/components/PageViewer.tsx

interface PageViewerProps {
  page: StudioPage;
  autoPlay: boolean;
}

export const PageViewer: React.FC<PageViewerProps> = ({ page, autoPlay }) => {
  const [visibleBalloons, setVisibleBalloons] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (!autoPlay) return;
    
    // Animate balloons sequentially
    const sortedBalloons = [...page.balloons].sort(
      (a, b) => (a.animationDelay ?? 0) - (b.animationDelay ?? 0)
    );
    
    sortedBalloons.forEach((balloon, index) => {
      const delay = balloon.animationDelay ?? (index * 0.3);
      setTimeout(() => {
        setVisibleBalloons(prev => new Set([...prev, balloon.id]));
      }, delay * 1000);
    });
    
    return () => setVisibleBalloons(new Set());
  }, [page, autoPlay]);

  return (
    <div className="page-viewer">
      <img src={page.imageUrl} alt="Comic page" className="page-image" />
      
      <svg className="balloons-layer" viewBox={`0 0 ${page.originalSize?.width} ${page.originalSize?.height}`}>
        {page.balloons.map(balloon => (
          <BalloonShape
            key={balloon.id}
            balloon={balloon}
            isVisible={visibleBalloons.has(balloon.id)}
          />
        ))}
      </svg>
    </div>
  );
};
```

### 3. `<BalloonShape />`

Renderização vetorial do balão (já existe parcialmente no Studio).

```tsx
// features/editor/components/BalloonShape.tsx

interface BalloonShapeProps {
  balloon: Balloon;
  isVisible: boolean;
}

export const BalloonShape: React.FC<BalloonShapeProps> = ({ balloon, isVisible }) => {
  // Build SVG path
  const pathData = useMemo(() => buildPath(balloon), [balloon]);
  
  return (
    <g
      className={`balloon-group ${isVisible ? 'visible' : 'hidden'}`}
      style={{
        transform: `translate(${balloon.boundingRect.x}px, ${balloon.boundingRect.y}px)`,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Shape */}
      <path
        d={pathData}
        fill={balloon.color ?? '#FFFFFF'}
        stroke={balloon.borderColor ?? '#000000'}
        strokeWidth={balloon.borderWidth ?? 2}
        opacity={balloon.opacity ?? 1}
      />
      
      {/* Text */}
      <foreignObject
        x={0}
        y={0}
        width={balloon.boundingRect.width}
        height={balloon.boundingRect.height}
      >
        <div className="balloon-text">
          {balloon.text}
        </div>
      </foreignObject>
    </g>
  );
};
```

### 4. Path Builder Functions

Replicar a lógica do Swift `buildPath`:

```typescript
// features/editor/utils/pathBuilder.ts

export function buildPath(balloon: Balloon): string {
  // If custom points, build Bézier path
  if (balloon.points && balloon.points.length > 2) {
    return buildBezierPath(balloon);
  }
  
  // Otherwise use shape presets
  return buildShapePath(balloon);
}

function buildBezierPath(balloon: Balloon): string {
  const { points, vertexHandles, boundingRect } = balloon;
  if (!points || points.length === 0) return '';
  
  let d = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const handle = vertexHandles?.[i - 1];
    
    if (handle?.handleOut && handle?.handleIn) {
      // Cubic Bézier
      d += ` C ${handle.handleOut.x} ${handle.handleOut.y}, ${handle.handleIn.x} ${handle.handleIn.y}, ${points[i].x} ${points[i].y}`;
    } else if (handle?.handleOut) {
      // Quadratic
      d += ` Q ${handle.handleOut.x} ${handle.handleOut.y}, ${points[i].x} ${points[i].y}`;
    } else {
      // Line
      d += ` L ${points[i].x} ${points[i].y}`;
    }
  }
  
  d += ' Z'; // Close path
  
  // Add tail if present
  if (balloon.tailTip) {
    d += buildTailPath(balloon);
  }
  
  return d;
}

function buildShapePath(balloon: Balloon): string {
  const { boundingRect, shape } = balloon;
  const { x, y, width, height } = boundingRect;
  
  switch (shape) {
    case 'ellipse':
      const rx = width / 2;
      const ry = height / 2;
      const cx = x + rx;
      const cy = y + ry;
      return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy} Z`;
      
    case 'rectangle':
      const r = 8; // corner radius
      return `M ${x + r} ${y} H ${x + width - r} Q ${x + width} ${y} ${x + width} ${y + r} V ${y + height - r} Q ${x + width} ${y + height} ${x + width - r} ${y + height} H ${x + r} Q ${x} ${y + height} ${x} ${y + height - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
      
    case 'cloud':
      return buildCloudPath(boundingRect);
      
    case 'scream':
      return buildScreamPath(boundingRect);
      
    default:
      return '';
  }
}

function buildCloudPath(rect: DOMRect): string {
  // 8 bumps around ellipse
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const rx = rect.width / 2;
  const ry = rect.height / 2;
  
  let d = '';
  const bumps = 8;
  
  for (let i = 0; i < bumps; i++) {
    const angle1 = i * (2 * Math.PI / bumps);
    const angle2 = (i + 1) * (2 * Math.PI / bumps);
    const midAngle = (angle1 + angle2) / 2;
    
    const r1 = rx * (0.8 + 0.2 * Math.sin(i * 1.5));
    const r2 = ry * (0.8 + 0.2 * Math.cos(i * 1.5));
    
    const x1 = cx + r1 * Math.cos(angle1);
    const y1 = cy + r2 * Math.sin(angle1);
    const x2 = cx + r1 * Math.cos(angle2);
    const y2 = cy + r2 * Math.sin(angle2);
    
    const bumpR = (r1 + r2) / 2 * 1.15;
    const cpX = cx + bumpR * Math.cos(midAngle);
    const cpY = cy + bumpR * Math.sin(midAngle);
    
    if (i === 0) {
      d = `M ${x1} ${y1}`;
    }
    
    d += ` Q ${cpX} ${cpY} ${x2} ${y2}`;
  }
  
  return d + ' Z';
}

function buildScreamPath(rect: DOMRect): string {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const rx = rect.width / 2;
  const ry = rect.height / 2;
  
  let d = '';
  const spikes = 12;
  
  for (let i = 0; i < spikes; i++) {
    const angle = i * (2 * Math.PI / spikes);
    const isSpike = i % 2 === 0;
    const radius = isSpike ? 1.0 : 0.7;
    
    const x = cx + rx * radius * Math.cos(angle);
    const y = cy + ry * radius * Math.sin(angle);
    
    if (i === 0) {
      d = `M ${x} ${y}`;
    } else {
      d += ` L ${x} ${y}`;
    }
  }
  
  return d + ' Z';
}

function buildTailPath(balloon: Balloon): string {
  if (!balloon.tailTip) return '';
  
  const { boundingRect, tailTip } = balloon;
  const baseWidth = 20;
  const baseY = boundingRect.y + boundingRect.height * 0.8;
  const midX = boundingRect.x + boundingRect.width / 2;
  
  return ` M ${midX - baseWidth / 2} ${baseY} L ${tailTip.x} ${tailTip.y} L ${midX + baseWidth / 2} ${baseY} Z`;
}
```

---

## CSS (iPhone Frame)

```css
/* features/editor/components/MobilePreview.css */

.mobile-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #1a1a1a;
}

.iphone-frame {
  width: 375px;
  height: 812px;
  background: #000;
  border-radius: 44px;
  padding: 12px;
  box-shadow: 
    0 0 0 3px #333,
    0 0 0 6px #1a1a1a,
    0 20px 40px rgba(0, 0, 0, 0.5);
  position: relative;
}

.iphone-notch {
  width: 150px;
  height: 30px;
  background: #000;
  border-radius: 0 0 20px 20px;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.iphone-screen {
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 38px;
  overflow: hidden;
  position: relative;
}

.iphone-home-indicator {
  width: 134px;
  height: 5px;
  background: #fff;
  border-radius: 3px;
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.3;
}

.page-viewer {
  width: 100%;
  height: 100%;
  position: relative;
}

.page-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.balloons-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.balloon-group {
  transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.balloon-group.hidden {
  opacity: 0;
  transform: scale(0.5);
}

.balloon-group.visible {
  opacity: 1;
  transform: scale(1);
}

.balloon-text {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  font-family: system-ui, sans-serif;
  padding: 8px;
}
```

---

## Integração no Studio

### Onde colocar o Preview

1. **Opção A: Modal dedicado** - Botão "Preview Mobile" no toolbar
2. **Opção B: Painel lateral** - Ao lado do canvas principal
3. **Opção C: Modo fullscreen** - Substitui o editor temporariamente

### Exemplo de uso

```tsx
// No ComicWorkstation.tsx ou similar

const [showMobilePreview, setShowMobilePreview] = useState(false);

// Converter arquivos do projeto para formato de preview
const previewPages: StudioPage[] = files
  .filter(f => f.type === 'file')
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map(file => ({
    imageUrl: file.cleanUrl || file.url,
    balloons: file.balloons || [],
    panels: file.panels || [],
    pageNumber: file.order,
  }));

return (
  <>
    <button onClick={() => setShowMobilePreview(true)}>
      Preview Mobile
    </button>
    
    {showMobilePreview && (
      <MobilePreviewModal onClose={() => setShowMobilePreview(false)}>
        <MobilePreview
          pages={previewPages}
          currentPageIndex={currentFileIndex}
          onPageChange={setCurrentFileIndex}
          autoPlayAnimations={true}
        />
      </MobilePreviewModal>
    )}
  </>
);
```

---

## Parâmetros de Animação (Replicar do Mobile)

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `spring.response` | 0.4s | Duração da animação |
| `spring.dampingFraction` | 0.7 | Suavidade do bounce |
| `delay.sequential` | 0.3s | Intervalo entre balões |
| `scale.initial` | 0.5 | Escala inicial |
| `scale.final` | 1.0 | Escala final |
| `opacity.initial` | 0 | Opacidade inicial |
| `opacity.final` | 1 | Opacidade final |

**CSS equivalent:**
```css
transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); /* Spring-like */
```

---

## Checklist de Implementação

- [ ] Criar `MobilePreview.tsx` com frame de iPhone
- [ ] Criar `PageViewer.tsx` com imagem + SVG overlay
- [ ] Criar `BalloonShape.tsx` com renderização vetorial
- [ ] Implementar `pathBuilder.ts` com todas as shapes
- [ ] Adicionar animações sequenciais de entrada
- [ ] Implementar navegação horizontal entre páginas
- [ ] Adicionar controles (página atual, total, setas)
- [ ] Botão "Replay Animations"
- [ ] Integrar no ExportModal ou toolbar
