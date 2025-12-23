
const fs = require('fs');

const cssContent = fs.readFileSync('css_input.txt', 'utf8');

const sections = {
    'top': { start: '/* Top View */', end: '/* Right Side */' },
    'right': { start: '/* Right Side */', end: '/* Left Side */' },
    'left': { start: '/* Left Side */', end: '/* Front Side */' },
    'front': { start: '/* Front Side */', end: '/* Back Side */' },
    'rear': { start: '/* Back Side */', end: null }
};

let output = '';

for (const [key, markers] of Object.entries(sections)) {
    let sectionContent = '';
    const startIndex = cssContent.indexOf(markers.start);
    if (startIndex === -1) continue;

    if (markers.end) {
        const endIndex = cssContent.indexOf(markers.end);
        sectionContent = cssContent.substring(startIndex, endIndex);
    } else {
        sectionContent = cssContent.substring(startIndex);
    }

    // Extract Dimensions
    const widthMatch = sectionContent.match(/width:\s*(\d+)px/);
    const heightMatch = sectionContent.match(/height:\s*(\d+)px/);
    const width = widthMatch ? widthMatch[1] : '100';
    const height = heightMatch ? heightMatch[1] : '100';

    output += `\n<!-- ${key.toUpperCase()} VIEW (${width}x${height}) -->\n`;
    output += `<div class="car-visual-container" style="position: relative; width: 100%; height: 100%; aspect-ratio: ${width}/${height};">\n`; // Use aspect-ratio to keep shape

    // Parse Vectors
    const vectorBlocks = sectionContent.split('/* Vector */');
    // Skip the first chunk (headers)
    for (let i = 1; i < vectorBlocks.length; i++) {
        const block = vectorBlocks[i];

        let style = 'position: absolute; ';

        const props = ['left', 'right', 'top', 'bottom', 'background'];

        props.forEach(prop => {
            const regex = new RegExp(`${prop}:\\s*([^;]+);`);
            const match = block.match(regex);
            if (match) {
                style += `${prop}: ${match[1].trim()}; `;
            }
        });

        output += `    <div style="${style}"></div>\n`;
    }
    output += `</div>\n`;
}

fs.writeFileSync('generated_views.html', output);
console.log('generated_views.html created');
