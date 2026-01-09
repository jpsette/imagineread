# 🕵️ Tech Lead Review: Top 10 Arquivos Críticos

Para entender **TODA** a arquitetura e complexidade do **Imagine Read Mobile** em 15 minutos, um Tech Lead deve revisar estes arquivos na seguinte ordem de prioridade:

## 1. O "Coração" da Lógica (Cinematic Engine)
`src/modules/reader/hooks/useCinematicViewport.ts`
> **Por que ler:** Contém a lógica matemática mais complexa do app. Implementa cálculo matricial para zoom/pan dinâmico e animações baseadas em física (`Reanimated 3`) para o modo "Guided View". É onde a mágica acontece.

## 2. Gerenciamento de Estado (Performance)
`src/modules/reader/store/useReaderStore.ts`
> **Por que ler:** Define como o estado é gerenciado (`readingMode`, `cinematicMode`, `textSize`). Diferente de Context API, aqui você verá o uso de `Zustand` para evitar re-renders desnecessários em componentes pesados.

## 3. O Controlador Principal (Integration)
`src/modules/reader/ReaderContainer.tsx`
> **Por que ler:** É o ponto de integração. Mostra como o módulo conecta o Estado (`store`), a Lógica (`hooks`) e a UI (`components/Renderers`). Demonstra o uso de `FlashList` e layout condicional.

## 4. Modelagem de Domínio (Contracts)
`src/modules/reader/types/index.ts`
> **Por que ler:** Define a estrutura de dados "Enterprise". Mostra como modelamos `ComicPage`, `Balloon`, e `FocusPoint`. Essencial para entender o contrato de dados antes de ver a implementação.

## 5. Renderização Dinâmica (SVG Layer)
`src/modules/reader/components/VectorBubble.tsx`
> **Por que ler:** A prova de conceito da "Tradução Dinâmica". Mostra como renderizamos SVG (`react-native-svg`) e Texto sobrepostos à imagem, permitindo acessibilidade e tradução realtime.

## 6. Camada de Serviço (Abstraction)
`src/modules/reader/services/MockReaderService.ts`
> **Por que ler:** Demonstra o padrão de desacoplamento. O app não consome API direta, mas sim uma implementação da interface `IReaderService`. Valioso para entender como será a integração com o Backend real.

## 7. Configuração do Boilerplate (Root)
`src/app/_layout.tsx`
> **Por que ler:** O ponto de entrada. Mostra configuração de `NativeWind` (Tailwind), `GestureHandler`, Fontes e Gestão de Temas. Define a base sólida do app.

## 8. Arquitetura de Navegação & Abas
`src/app/(tabs)/_layout.tsx`
> **Por que ler:** Exemplo prático de `Expo Router` com navegação por abas customizada (ícones Lucide, cores de tema, UX).

## 9. Design System & Tema
`tailwind.config.js`
> **Por que ler:** A "verdade" visual do app. Define a paleta de cores "Notion-style" (Dark Mode), fontes e espaçamentos que guiam toda a UI via classes utilitárias.

## 10. A API Pública do Módulo
`src/modules/reader/index.ts`
> **Por que ler:** O "porteiro". Define EXATAMENTE o que o resto do app pode ver do módulo `reader`. É o arquivo que garante o encapsulamento e permite a arquitetura modular.
