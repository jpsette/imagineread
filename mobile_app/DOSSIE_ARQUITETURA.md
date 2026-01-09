# 📱 Dossiê Técnico: Imagine Read Mobile
**Versão:** 1.0.0
**Status:** Arquitetura Enterprise-Grade (DDD)
**Stack:** React Native (Expo) + TypeScript

---

## 1. Visão Executiva
O projeto **Imagine Read Mobile** foi arquitetado para ser uma aplicação de **alta performance** e **escala massiva**. Fugindo de estruturas genéricas, adotamos uma arquitetura orientada a domínio (**Domain-Driven Design - DDD**) que isola completamente a lógica de negócios da camada de apresentação, permitindo que funcionalidades complexas (como o *Cinematic Engine*) evoluam independentemente do shell da aplicação.

## 2. Stack Tecnológico

| Categoria | Tecnologia | Justificativa Técnica |
| :--- | :--- | :--- |
| **Framework** | **Expo (Managed)** | Acelerador de desenvolvimento, updates OTA (Over-the-Air) e estabilidade nativa. |
| **Linguagem** | **TypeScript** | Segurança de tipos rigorosa para manutenção em escala. |
| **Styling** | **NativeWind (v4)** | Produtividade do Tailwind CSS com compilação nativa (zero runtime overheard). |
| **State** | **Zustand** | Gerenciamento de estado atômico e de alta performance, evitando re-renders desnecessários (crucial para o Leitor). |
| **Navigation** | **Expo Router** | Roteamento baseado em arquivos (File-based), padrão moderno e intuitivo. |
| **Animation** | **Reanimated 3** | Animações rodando na **UI Thread**, garantindo 60/120 FPS mesmo em interações complexas. |
| **Listas** | **FlashList** | Performance 5x superior ao FlatList padrão, essencial para renderizar quadrinhos verticais longos (Webtoon). |
| **Graphics** | **React Native SVG** | Renderização vetorial para balões dinâmicos que não perdem qualidade no zoom. |

---

## 3. Arquitetura Modular (DDD)

Adotamos o conceito de **Clean Architecture** adaptado para Mobile. O projeto não é apenas uma coleção de telas, mas sim um conjunto de **Módulos Independentes**.

### Estrutura de Diretórios
```text
src/
├── app/                  # Camada de Apresentação (Shell)
│   ├── (tabs)/           # Navegação principal
│   └── reader/[id].tsx   # Rota dinâmica (apenas invoca o Container)
├── core/                 # Shared Kernel (Utilitários globais, Base UI)
└── modules/              # FEATURE SLICES (O coração do app)
    └── reader/           # Módulo "Leitor" (Totalmente Isolado)
        ├── components/   # UI Pura (VectorBubble, Controls)
        ├── hooks/        # Lógica de Negócio (useCinematicViewport)
        ├── services/     # Camada de Dados (IReaderService implementation)
        ├── store/        # Estado Local (Zustand Store)
        ├── types/        # Modelos de Domínio (ComicPage, FocusPoint)
        └── ReaderContainer.tsx # Entry Point (Controller)
```

### Princípios Aplicados:
1.  **Isolamento**: O módulo `reader` não depende de nada externo além do `core`. Ele poderia ser extraído para um pacote NPM separado amanhã sem quebrar o app.
2.  **Interface Segregation**: A comunicação de dados é feita via interfaces rigorosas (`IReaderService`). Isso permite que troquemos o `MockReaderService` por uma implementação GraphQL ou REST real sem alterar uma linha da UI.
3.  **Dependency Inversion**: A UI (`ReaderContainer`) não sabe de onde vêm os dados, apenas consome a abstração do Serviço e da Store.

---

## 4. O "Cinematic Engine" (Diferencial Técnico)

O recurso mais complexo do app é o **Modo Cinematográfico** (Guided View), que foi desenvolvido com engenharia matemática avançada para garantir fluidez.

### Como Funciona:
1.  **Matriz de Foco**: Cada página possui metadados de `FocusPoints` (coordenadas de painéis e balões).
2.  **Cálculo Dinâmico**: O hook customizado `useCinematicViewport` utiliza **Cálculo Matricial** em tempo real para determinar:
    *   **Scale**: Zoom exato para que o elemento alvo ocupe a proporção ideal da tela.
    *   **Translation (X,Y)**: O deslocamento necessário para centralizar o vetor alvo no viewport do dispositivo.
3.  **Physics-Based Animation**: Nenhuma transição é linear. Usamos `Spring Physics` (Reanimated) para simular o movimento de uma câmera física, criando uma sensação "orgânica" e premium.

---

## 5. Estratégia de Performance

Para garantir que o app suporte milhões de usuários e HQs com centenas de páginas:

*   **Renderização Dinâmica**: Balões de fala não são imagens ('burned-in'). São **Vetores SVG** renderizados em tempo real sobre a imagem da página. Isso permite:
    *   Tradução instantânea.
    *   Acessibilidade (aumentar tamanho da fonte no balão).
    *   Redução drástica de banda (não precisamos baixar imagens diferentes para cada idioma).
*   **Gestão de Memória**: O `FlashList` recicla componentes de visualização agressivamente, permitindo listas infinitas sem vazamento de memória.
*   **Zustand Selectors**: Os componentes só re-renderizam se o pedaço específico do estado que eles observam mudar. O controle de zoom não re-renderiza a lista de páginas.

---

## 6. Conclusão

Esta arquitetura não foi feita para um "MVP". Ela foi desenhada como fundação para um **Super App de Leitura Global**. A separação de responsabilidades, o uso de engines nativas de animação e a estratégia de dados desacoplada garantem que o **Imagine Read Mobile** seja escalável, manutenível e visualmente impressionante desde o dia zero.
