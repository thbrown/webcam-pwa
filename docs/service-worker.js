/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-68b3524c'], (function (workbox) { 'use strict';

  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "../docs/index.html",
    "revision": "ee9570c52c1b3b381192a7fafa4cb5f2"
  }, {
    "url": "02bba2420fd6f2359caa47220daccf11.woff2",
    "revision": null
  }, {
    "url": "14bed5657499b9a503d6.svg?a955aae518af76b31d2083dbdaa71632",
    "revision": null
  }, {
    "url": "169ef7eb96e6ffb8454071133daab1b7.eot",
    "revision": null
  }, {
    "url": "1df90a21b1aeed40eac3.woff?60999a3491ee956dee90d55633f983d2",
    "revision": null
  }, {
    "url": "25cbdc49993409d8c1d4b166a15dc4bc.svg",
    "revision": null
  }, {
    "url": "2a3f0c72e8623f326405.woff?a955aae518af76b31d2083dbdaa71632",
    "revision": null
  }, {
    "url": "320ac3f329d7a2ceeef362d53bcaa063.woff",
    "revision": null
  }, {
    "url": "34c397e960eb6a13cdaf.eot?60999a3491ee956dee90d55633f983d2",
    "revision": null
  }, {
    "url": "36f65cf9a8a5c7ec7dc1.eot?a955aae518af76b31d2083dbdaa71632",
    "revision": null
  }, {
    "url": "4f3b816c988efd943d60.ttf?a955aae518af76b31d2083dbdaa71632",
    "revision": null
  }, {
    "url": "59fca911073843a782a88713011ab835.ttf",
    "revision": null
  }, {
    "url": "66fb498446c793829af147e334d4c4e7.svg",
    "revision": null
  }, {
    "url": "709475b67089c8458aa304a790abc31d.woff",
    "revision": null
  }, {
    "url": "816ad36e26456d4aa60c061ca7d6d9c1.ttf",
    "revision": null
  }, {
    "url": "83c03da5f8bef2b091bd.svg?60999a3491ee956dee90d55633f983d2",
    "revision": null
  }, {
    "url": "9e2e33b8c8fbe2aeb33b.woff2?a955aae518af76b31d2083dbdaa71632",
    "revision": null
  }, {
    "url": "CameraPerms.gif",
    "revision": "4fc56ccec9687d032ecdf4686b795bb4"
  }, {
    "url": "a797378e2d729a2127ef.woff2?60999a3491ee956dee90d55633f983d2",
    "revision": null
  }, {
    "url": "apple-touch-icon-180x180.png",
    "revision": "f076f1cf6d910b3fac8c0ff9d8696f8c"
  }, {
    "url": "b601f6477390221e93e9359b7651c085.eot",
    "revision": null
  }, {
    "url": "blueprint-icons-16px-paths.bundle.js",
    "revision": "db26bc64067d7a800710385a28e59466"
  }, {
    "url": "blueprint-icons-20px-paths.bundle.js",
    "revision": "ff73646c73366a0a766db22e84d0dfc5"
  }, {
    "url": "blueprint-icons-all-paths-loader.bundle.js",
    "revision": "52df182b6acd15ebddb77fb59226f485"
  }, {
    "url": "blueprint-icons-all-paths.bundle.js",
    "revision": "b0ea374db72eaa42f77bcd9ad4016062"
  }, {
    "url": "blueprint-icons-split-paths-by-size-loader.bundle.js",
    "revision": "915355529ef09f1f43bc0fc76f1eb4de"
  }, {
    "url": "bundle.js",
    "revision": "880861d971c08a873e7daf38cbd0accc"
  }, {
    "url": "bundle.worker.js",
    "revision": "7664eef3567b7bc6a645fcd443361826"
  }, {
    "url": "ca68e9302559b78f2c04.ttf?60999a3491ee956dee90d55633f983d2",
    "revision": null
  }, {
    "url": "e45a6485f41e3cfcf741704d51380f40.woff2",
    "revision": null
  }, {
    "url": "favicon.svg",
    "revision": "8f714a310a787248af53afb94cd9d877"
  }, {
    "url": "manifest.json",
    "revision": "238f86961e60708c768fc1b9c29178fa"
  }, {
    "url": "maskable_icon_x192.png",
    "revision": "f076f1cf6d910b3fac8c0ff9d8696f8c"
  }, {
    "url": "maskable_icon_x512.png",
    "revision": "3e63266adc84aac9fcb7637bc5bbb509"
  }, {
    "url": "node_modules_ffmpeg_ffmpeg_dist_esm_worker_js.bundle.js",
    "revision": "72bb9d5e86242e440fcc3d7e22331f04"
  }, {
    "url": "timel.app.png",
    "revision": "aee486e3c6ed24a066d4de07ccc95b25"
  }, {
    "url": "wasm_webp.js",
    "revision": "c67b71c53f72380479e5fc5d25d97f05"
  }, {
    "url": "wasm_webp.wasm",
    "revision": "afb2f6491974177cdc243dec47ed2ce9"
  }], {});

}));
//# sourceMappingURL=service-worker.js.map
