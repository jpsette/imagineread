const fs = require('fs');
const parser = require('@babel/parser');

const code = fs.readFileSync('src/App.tsx', 'utf8');

try {
    parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx', 'classProperties']
    });
    console.log("No syntax errors found by Babel.");
} catch (e) {
    console.log("Syntax Error:", e.message);
    console.log("Location:", e.loc);

    // Print context
    if (e.loc) {
        const lines = code.split('\n');
        const start = Math.max(0, e.loc.line - 5);
        const end = Math.min(lines.length, e.loc.line + 5);
        console.log("\nContext:");
        for (let i = start; i < end; i++) {
            console.log(`${i + 1}: ${lines[i]}`);
        }
    }
}
