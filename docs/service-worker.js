if(!self.define){let e,a={};const f=(f,d)=>(f=new URL(f+".js",d).href,a[f]||new Promise((a=>{if("document"in self){const e=document.createElement("script");e.src=f,e.onload=a,document.head.appendChild(e)}else e=f,importScripts(f),a()})).then((()=>{let e=a[f];if(!e)throw new Error(`Module ${f} didn’t register its module`);return e})));self.define=(d,l)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(a[i])return;let c={};const r=e=>f(e,i),n={module:{uri:i},exports:c,require:r};a[i]=Promise.all(d.map((e=>n[e]||r(e)))).then((e=>(l(...e),c)))}}define(["./workbox-9a84fccb"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"../docs/index.html",revision:"928495bc13b576b6dd4e3fa340a2a0df"},{url:"02bba2420fd6f2359caa47220daccf11.woff2",revision:null},{url:"104.bundle.js",revision:"ef1a8a006bb49eea75ba2f07c386e92d"},{url:"14bed5657499b9a503d6.svg?a955aae518af76b31d2083dbdaa71632",revision:null},{url:"169ef7eb96e6ffb8454071133daab1b7.eot",revision:null},{url:"1df90a21b1aeed40eac3.woff?60999a3491ee956dee90d55633f983d2",revision:null},{url:"25cbdc49993409d8c1d4b166a15dc4bc.svg",revision:null},{url:"2a3f0c72e8623f326405.woff?a955aae518af76b31d2083dbdaa71632",revision:null},{url:"320ac3f329d7a2ceeef362d53bcaa063.woff",revision:null},{url:"34c397e960eb6a13cdaf.eot?60999a3491ee956dee90d55633f983d2",revision:null},{url:"36f65cf9a8a5c7ec7dc1.eot?a955aae518af76b31d2083dbdaa71632",revision:null},{url:"439.bundle.js",revision:"7a35e70ac82d22c37462faa34497c79f"},{url:"4f3b816c988efd943d60.ttf?a955aae518af76b31d2083dbdaa71632",revision:null},{url:"500.bundle.js",revision:"250ad6c455e3470e7d680dc80a331f8b"},{url:"569.bundle.js",revision:"2830c5c780792e1de083ecf3542e0db7"},{url:"59fca911073843a782a88713011ab835.ttf",revision:null},{url:"66fb498446c793829af147e334d4c4e7.svg",revision:null},{url:"680.bundle.js",revision:"26cf67a38e8263a76bfddb7cae168ef9"},{url:"709475b67089c8458aa304a790abc31d.woff",revision:null},{url:"816ad36e26456d4aa60c061ca7d6d9c1.ttf",revision:null},{url:"83c03da5f8bef2b091bd.svg?60999a3491ee956dee90d55633f983d2",revision:null},{url:"9e2e33b8c8fbe2aeb33b.woff2?a955aae518af76b31d2083dbdaa71632",revision:null},{url:"CameraPerms.gif",revision:"4fc56ccec9687d032ecdf4686b795bb4"},{url:"a797378e2d729a2127ef.woff2?60999a3491ee956dee90d55633f983d2",revision:null},{url:"b601f6477390221e93e9359b7651c085.eot",revision:null},{url:"bundle.js",revision:"b3548abf9beda1564be173fee3523c60"},{url:"bundle.js.LICENSE.txt",revision:"b52da66745372c61d24077e37d7f5d5e"},{url:"ca68e9302559b78f2c04.ttf?60999a3491ee956dee90d55633f983d2",revision:null},{url:"e45a6485f41e3cfcf741704d51380f40.woff2",revision:null},{url:"favicon.svg",revision:"8f714a310a787248af53afb94cd9d877"},{url:"manifest.json",revision:"238f86961e60708c768fc1b9c29178fa"},{url:"maskable_icon_x192.png",revision:"f076f1cf6d910b3fac8c0ff9d8696f8c"},{url:"maskable_icon_x512.png",revision:"3e63266adc84aac9fcb7637bc5bbb509"},{url:"timel.app.png",revision:"aee486e3c6ed24a066d4de07ccc95b25"},{url:"wasm_webp.js",revision:"24d29f2a09fc8154d5a11bc29f3747af"},{url:"wasm_webp.wasm",revision:"afb2f6491974177cdc243dec47ed2ce9"}],{})}));
//# sourceMappingURL=service-worker.js.map
