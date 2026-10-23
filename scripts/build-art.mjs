import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const source = await readFile(new URL('../assets/observatory.png', import.meta.url));
assert.equal(source.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'The backdrop must be a PNG');
assert.equal(source.readUInt32BE(16), 1983, 'Backdrop width changed; update the animation placement');
assert.equal(source.readUInt32BE(20), 793, 'Backdrop height changed; update the animation placement');
const backdrop = source.toString('base64');
const wolf = `<g shape-rendering="crispEdges">
  <ellipse cx="18" cy="33" rx="17" ry="2" fill="#080d20" opacity=".5"/>
  <g class="wolf-breathe">
    <g class="wolf-tail">
      <path fill="#899ac7" d="M21 23h5v2h5v2h4v3h-2v3h-5v-2h-5z"/>
      <path fill="#dce8ff" d="M22 24h4v2h5v2h3v2h-3v1h-3v-2h-5z"/>
      <path fill="#f6f6ff" d="M29 27h3v1h2v2h-3v-1h-2z"/>
    </g>
    <path fill="#8393bf" d="M8 16h13v3h3v5h2v8h-5v1H6v-3H4v-6h2v-5h2z"/>
    <path fill="#dee7ff" d="M9 17h10v3h3v5h1v6h-5v-8h-2v8H9v-8H7v-3h2z"/>
    <path fill="#f7f8ff" d="M10 18h8v6h-2v7h-5v-6H9v-4h1z"/>
    <path fill="#b7c8e8" d="M6 30h5v2H6zm11 0h6v2h-6z"/>
    <path fill="#7a88b1" d="M4 1h3v2h3v3h8V3h3V1h3v9h2v7h-3v3h-5v2h-8v-2H5v-3H2v-7h2z"/>
    <path fill="#e4ecff" d="M5 3h2v3h3v2h8V6h3V3h2v8h2v5h-3v3h-4v2h-8v-2H6v-3H3v-5h2z"/>
    <path fill="#fafaff" d="M8 8h12v3h3v5h-4v3h-8v-2H6v-5h2z"/>
    <path fill="#a7b5d9" d="M6 5h1v3H6zm15 0h1v3h-1zM4 13h3v3H4zm18 0h2v3h-2z"/>
    <g class="wolf-eyes"><path fill="#455a86" d="M8 11h4v3H8zm9 0h4v3h-4z"/><path fill="#3ca7ff" d="M9 11h3v2H9zm8 0h3v2h-3z"/><path fill="#d1f9ff" d="M9 11h1v1H9zm8 0h1v1h-1z"/></g>
    <g class="wolf-lids" fill="#64779e"><path d="M8 12h4v1H8zm9 0h4v1h-4z"/></g>
    <path fill="#b8c7e7" d="M11 15h7v3h-2v1h-3v-1h-2z"/>
    <path fill="#29334f" d="M13 15h3v2h-3zm1 2h1v2h-1z"/>
    <path fill="#f7f8ff" d="M7 9h4v1H7zm11 0h4v1h-4z"/>
  </g>
</g>`;

const stars = [[442,210,4],[693,83,5],[802,72,6],[1069,90,5],[1358,80,4],[1481,75,4],[1622,53,5],[1789,37,6],[1821,60,4],[1878,85,3],[644,400,4],[1178,320,6]];
const sparkles = stars.map(([x,y,size], i) => `<g class="twinkle t${i % 4}" transform="translate(${x} ${y})" fill="${i % 3 ? '#ceddff' : '#f8e5be'}"><rect x="-${size}" y="-1" width="${size*2+1}" height="3"/><rect x="-1" y="-${size}" width="3" height="${size*2+1}"/></g>`).join('');

const hero = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1120" height="448" viewBox="0 0 1983 793" role="img" aria-labelledby="title desc">
<title id="title">Penzragon — Rifky Aliffa</title><desc id="desc">A cozy pixel-art observatory at night. Rifky codes beside a white wolf with blue eyes. Stars twinkle, clouds drift, the screen glows, and the wolf blinks and moves its tail.</desc>
<style>
.twinkle{animation:twinkle 4s ease-in-out infinite}.t1{animation-delay:-1s}.t2{animation-delay:-2s}.t3{animation-delay:-3s}
.wolf-breathe{animation:breathe 4s steps(4,end) infinite;transform-origin:15px 33px}.wolf-tail{animation:tail 4s steps(5,end) infinite;transform-origin:23px 25px}
.wolf-eyes{animation:eyes 7s steps(1,end) infinite}.wolf-lids{opacity:0;animation:lids 7s steps(1,end) infinite}
.screen{animation:screen 5s ease-in-out infinite}.cloud{animation:cloud 24s ease-in-out infinite alternate}.water{animation:water 4s steps(6,end) infinite alternate}
@keyframes twinkle{0%,100%{opacity:.12}50%{opacity:.9}}@keyframes breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-.6px)}}
@keyframes tail{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(12deg)}}@keyframes eyes{0%,43%,47%,83%,87%,100%{opacity:1}44%,46%,84%,86%{opacity:0}}@keyframes lids{0%,43%,47%,83%,87%,100%{opacity:0}44%,46%,84%,86%{opacity:1}}
@keyframes screen{0%,100%{opacity:.02}50%{opacity:.11}}@keyframes cloud{from{transform:translateX(-14px);opacity:.12}to{transform:translateX(18px);opacity:.2}}@keyframes water{from{transform:translateX(-5px);opacity:.15}to{transform:translateX(7px);opacity:.65}}
@media(prefers-reduced-motion:reduce){*{animation:none!important}.wolf-lids{opacity:0}}
</style>
<image width="1983" height="793" href="data:image/png;base64,${backdrop}"/>
${sparkles}
<path class="screen" d="M507 440L848 428V629L508 641Z" fill="#b3d7ff"/>
<g class="cloud" fill="#7484ca" shape-rendering="crispEdges"><path d="M1410 301h14v-7h22v-6h25v7h19v7h22v7h-102zm181 37h19v-7h20v-8h24v7h28v8h17v7h-108z"/></g>
<g class="water" fill="#fbc4a8" shape-rendering="crispEdges"><path d="M1439 603h18v3h-18zm69 15h29v3h-29zm107-18h13v3h-13zm75 25h25v3h-25zm-280 21h22v3h-22zm224 20h24v3h-24z"/></g>
<g transform="translate(953 444) scale(4.8)">${wolf}</g>
</svg>\n`;
await writeFile(new URL('../assets/hero.svg', import.meta.url), hero);

const divider = `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="64" viewBox="0 0 1120 64" role="img" aria-label="Twinkling pixel stars above a quiet mountain skyline">
<style>.star{animation:shine 4s ease-in-out infinite alternate}.later{animation-delay:-2s}@keyframes shine{from{opacity:.25}to{opacity:1}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>
<path d="M0 33h420m280 0h420" stroke="#6268a2" opacity=".45"/>
<path d="M440 49h20v-8h9v-8h10v-8h10v-9h9v9h10v8h10v8h11v8h19v6H440zm108 0h17v-8h10v-8h10v8h10v8h19v6h-66zm60 0h12v-9h10v-8h10V20h9v12h10v8h10v9h16v6h-77z" fill="#333d75"/>
<path d="M479 25h10v-9h9v9h10v8h-9v-5h-10v5h-10zm151 7h10V20h9v12h10v8h-9v-4h-11v4h-9z" fill="#a5a8df"/>
<g class="star" fill="#dce8ff"><path d="M547 10h3v6h6v3h-6v6h-3v-6h-6v-3h6zM408 29h3v8h-3zM405 32h9v3h-9z"/></g><g class="star later" fill="#b9eee9"><path d="M596 3h3v5h5v3h-5v5h-3v-5h-5V8h5zM710 29h3v8h-3zM707 32h9v3h-9z"/></g>
</svg>\n`;
await writeFile(new URL('../assets/divider.svg', import.meta.url), divider);
console.log('Built animated hero and section divider with a self-contained background and reduced-motion support.');
