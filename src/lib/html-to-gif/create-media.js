import { popularFontsLinks } from '../components/grapeJS/style-sheet.js';

const getHTMLandCSS = (html, css) => {
    const fonts = popularFontsLinks.map((link) => `<link href="${link}" rel="stylesheet">`).join('');
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
             ${fonts}
        </head>
            ${html}
        <style>
        ${css}
        </style>
        </html>
    `;
};

export {
    getHTMLandCSS,
}