export const parseSvgFile = async (file: File): Promise<{ path: string, viewBox: { width: number, height: number } }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) throw new Error("Empty file");

                const parser = new DOMParser();
                const doc = parser.parseFromString(text, "image/svg+xml");
                const svg = doc.querySelector("svg");

                if (!svg) throw new Error("No SVG element found");

                // 1. Extract Dimensions (ViewBox or Width/Height)
                let width = 100;
                let height = 100;
                const viewBox = svg.getAttribute("viewBox");

                if (viewBox) {
                    const parts = viewBox.split(/[\s,]+/).map(Number);
                    if (parts.length === 4) {
                        width = parts[2];
                        height = parts[3];
                    }
                } else {
                    const w = parseFloat(svg.getAttribute("width") || "100");
                    const h = parseFloat(svg.getAttribute("height") || "100");
                    width = isNaN(w) ? 100 : w;
                    height = isNaN(h) ? 100 : h;
                }

                // 2. Extract Path Data
                // Strategy: Find first path. If none, check for basic shapes and convert (simple) or fail.
                const pathNode = doc.querySelector("path");
                let d = "";

                if (pathNode) {
                    d = pathNode.getAttribute("d") || "";
                } else {
                    // Fallback: Try to convert Rect/Circle to Path (Basic support)
                    // For now, let's just error if no path, or return empty
                    // Ideally we should flatten the SVG, but that's complex.
                    // Let's search for *any* shape
                    const rect = doc.querySelector("rect");
                    if (rect) {
                        // Rect to Path
                        const x = parseFloat(rect.getAttribute("x") || "0");
                        const y = parseFloat(rect.getAttribute("y") || "0");
                        const w = parseFloat(rect.getAttribute("width") || "0");
                        const h = parseFloat(rect.getAttribute("height") || "0");
                        d = `M${x},${y} h${w} v${h} h-${w} Z`;
                    }
                }

                if (!d) throw new Error("No usable <path> found in SVG");

                resolve({
                    path: d,
                    viewBox: { width, height }
                });

            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
};
