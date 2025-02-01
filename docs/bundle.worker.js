/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/ts-whammy/src/libs/index.ts":
/*!**************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/index.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_toWebM__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/toWebM */ "./node_modules/ts-whammy/src/libs/utils/toWebM.ts");
/* harmony import */ var _utils_parseWebP__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/parseWebP */ "./node_modules/ts-whammy/src/libs/utils/parseWebP.ts");
/* harmony import */ var _utils_parseRIFF2__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/parseRIFF2 */ "./node_modules/ts-whammy/src/libs/utils/parseRIFF2.ts");
/* harmony import */ var _utils_adaptor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/adaptor */ "./node_modules/ts-whammy/src/libs/utils/adaptor.ts");
/* harmony import */ var _utils_imageSrcToWebpDataUrl__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils/imageSrcToWebpDataUrl */ "./node_modules/ts-whammy/src/libs/utils/imageSrcToWebpDataUrl.ts");





const defaultFps = 1;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  fromImageArray(images, fps, outputAsArray) {
    const curOutputAsArray = typeof Blob !== 'undefined' ? outputAsArray : true;
    const curFps = fps || defaultFps;
    return (0,_utils_toWebM__WEBPACK_IMPORTED_MODULE_0__["default"])(images.map((image, index) => {
      try {
        const webp = (0,_utils_parseWebP__WEBPACK_IMPORTED_MODULE_1__["default"])((0,_utils_parseRIFF2__WEBPACK_IMPORTED_MODULE_2__["default"])((0,_utils_adaptor__WEBPACK_IMPORTED_MODULE_3__.autoAtob)(image.slice(23))));
        const webpFrame = {
          ...webp,
          duration: 1000 / curFps
        };
        return webpFrame;
      } catch (error) {
        console.error(`Before toWebM Error, Image Index ${index}`);
        throw error;
      }
    }), curOutputAsArray);
  },
  fromImageArrayWithOptions(images, options = {}) {
    const {
      fps,
      duration,
      outputAsArray
    } = options;
    let curFps = fps || defaultFps;
    if (duration) {
      curFps = 1000 / (duration * 1000 / images.length);
    }
    return this.fromImageArray(images, curFps, outputAsArray);
  },
  async fixImageDataList(images, options) {
    const result = [];
    for (const item of images) {
      const temp = await (0,_utils_imageSrcToWebpDataUrl__WEBPACK_IMPORTED_MODULE_4__.imageSrcToWebpDataUrl)(item, options);
      result.push(temp);
    }
    return result;
  }
});

/***/ }),

/***/ "./node_modules/ts-whammy/src/libs/utils/adaptor.ts":
/*!**********************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/utils/adaptor.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   autoAtob: () => (/* binding */ autoAtob)
/* harmony export */ });
function autoAtob(str) {
  if (typeof atob !== 'undefined') {
    return atob(str);
  }
  return Buffer.from(str, 'base64').toString('binary');
}

/***/ }),

/***/ "./node_modules/ts-whammy/src/libs/utils/base.ts":
/*!*******************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/utils/base.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   bitsToBuffer: () => (/* binding */ bitsToBuffer),
/* harmony export */   doubleToString: () => (/* binding */ doubleToString),
/* harmony export */   numToBuffer: () => (/* binding */ numToBuffer),
/* harmony export */   numToFixedBuffer: () => (/* binding */ numToFixedBuffer),
/* harmony export */   strToBuffer: () => (/* binding */ strToBuffer),
/* harmony export */   toBinStr_old: () => (/* binding */ toBinStr_old)
/* harmony export */ });
function numToBuffer(num) {
  const parts = [];
  while (num > 0) {
    parts.push(num & 0xff);
    num = num >> 8;
  }
  return new Uint8Array(parts.reverse());
}
function numToFixedBuffer(num, size) {
  const parts = new Uint8Array(size);
  for (let i = size - 1; i >= 0; i--) {
    parts[i] = num & 0xff;
    num = num >> 8;
  }
  return parts;
}
function strToBuffer(str) {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}
function bitsToBuffer(bits) {
  const data = [];
  const pad = bits.length % 8 ? new Array(1 + 8 - bits.length % 8).join('0') : '';
  const curBits = pad + bits;
  for (let i = 0; i < curBits.length; i += 8) {
    data.push(parseInt(curBits.substr(i, 8), 2));
  }
  return new Uint8Array(data);
}
function toBinStr_old(bits) {
  let data = '';
  const pad = bits.length % 8 ? new Array(1 + 8 - bits.length % 8).join('0') : '';
  const curBits = pad + bits;
  for (let i = 0; i < curBits.length; i += 8) {
    data += String.fromCharCode(parseInt(curBits.substr(i, 8), 2));
  }
  return data;
}
function doubleToString(num) {
  return [].slice.call(new Uint8Array(new Float64Array([num]).buffer), 0).map(e => String.fromCharCode(e)).reverse().join('');
}

/***/ }),

/***/ "./node_modules/ts-whammy/src/libs/utils/checkFrames.ts":
/*!**************************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/utils/checkFrames.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ checkFrames)
/* harmony export */ });
function checkFrames(frames) {
  const width = frames[0].width;
  const height = frames[0].height;
  let duration = frames[0].duration;
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].width !== width) {
      throw new Error('Frame ' + (i + 1) + ' has a different width');
    }
    if (frames[i].height !== height) {
      throw new Error('Frame ' + (i + 1) + ' has a different height');
    }
    if (frames[i].duration < 0 || frames[i].duration > 0x7fff) {
      throw new Error('Frame ' + (i + 1) + ' has a weird duration (must be between 0 and 32767)');
    }
    duration += frames[i].duration;
  }
  return {
    duration,
    width,
    height
  };
}

/***/ }),

/***/ "./node_modules/ts-whammy/src/libs/utils/generateEBML.ts":
/*!***************************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/utils/generateEBML.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ generateEBML)
/* harmony export */ });
/* harmony import */ var _base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base */ "./node_modules/ts-whammy/src/libs/utils/base.ts");
/* harmony import */ var _toFlatArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./toFlatArray */ "./node_modules/ts-whammy/src/libs/utils/toFlatArray.ts");


function generateEBML(json, outputAsArray) {
  const ebml = [];
  for (const item of json) {
    if (!('id' in item)) {
      // already encoded blob or byteArray
      ebml.push(item);
      continue;
    }
    let data = item.data;
    if (typeof data === 'object') {
      data = generateEBML(data, outputAsArray);
    }
    if (typeof data === 'number') {
      data = 'size' in item ? (0,_base__WEBPACK_IMPORTED_MODULE_0__.numToFixedBuffer)(data, item.size || 0) : (0,_base__WEBPACK_IMPORTED_MODULE_0__.bitsToBuffer)(data.toString(2));
    }
    if (typeof data === 'string') {
      data = (0,_base__WEBPACK_IMPORTED_MODULE_0__.strToBuffer)(data);
    }

    // if (data.length) {
    //   const z = z
    // }

    const len = data.size || data.byteLength || data.length;
    const zeroes = Math.ceil(Math.ceil(Math.log(len) / Math.log(2)) / 8);
    const sizeStr = len.toString(2);
    const padded = new Array(zeroes * 7 + 7 + 1 - sizeStr.length).join('0') + sizeStr;
    const size = new Array(zeroes).join('0') + '1' + padded;

    // i actually dont quite understand what went on up there, so I'm not really
    // going to fix this, i'm probably just going to write some hacky thing which
    // converts that string into a buffer-esque thing

    ebml.push((0,_base__WEBPACK_IMPORTED_MODULE_0__.numToBuffer)(item.id));
    ebml.push((0,_base__WEBPACK_IMPORTED_MODULE_0__.bitsToBuffer)(size));
    ebml.push(data);
  }

  // output as blob or byteArray
  if (outputAsArray) {
    // convert ebml to an array
    const buffer = (0,_toFlatArray__WEBPACK_IMPORTED_MODULE_1__["default"])(ebml);
    return new Uint8Array(buffer);
  } else {
    return new Blob(ebml, {
      type: 'video/webm'
    });
  }
}

/***/ }),

/***/ "./node_modules/ts-whammy/src/libs/utils/getEBMLCuePoint.ts":
/*!******************************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/utils/getEBMLCuePoint.ts ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(clusterTimecode) {
  const cuePoint = {
    id: 0xbb,
    // CuePoint
    data: [{
      data: Math.round(clusterTimecode),
      id: 0xb3 // CueTime
    }, {
      id: 0xb7,
      // CueTrackPositions
      data: [{
        data: 1,
        id: 0xf7 // CueTrack
      }, {
        data: 0,
        // to be filled in when we know it
        size: 8,
        id: 0xf1 // CueClusterPosition
      }]
    }]
  };
  return cuePoint;
}

/***/ }),

/***/ "./node_modules/ts-whammy/src/libs/utils/getEBMLShell.ts":
/*!***************************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/utils/getEBMLShell.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ getEBMLShell)
/* harmony export */ });
/* harmony import */ var _base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base */ "./node_modules/ts-whammy/src/libs/utils/base.ts");

function getEBMLShell(info) {
  const EBML = [{
    id: 0x1a45dfa3,
    // EBML
    data: [{
      data: 1,
      id: 0x4286 // EBMLVersion
    }, {
      data: 1,
      id: 0x42f7 // EBMLReadVersion
    }, {
      data: 4,
      id: 0x42f2 // EBMLMaxIDLength
    }, {
      data: 8,
      id: 0x42f3 // EBMLMaxSizeLength
    }, {
      data: 'webm',
      id: 0x4282 // DocType
    }, {
      data: 2,
      id: 0x4287 // DocTypeVersion
    }, {
      data: 2,
      id: 0x4285 // DocTypeReadVersion
    }]
  }, {
    id: 0x18538067,
    // Segment
    data: [{
      id: 0x1549a966,
      // Info
      data: [{
        data: 1e6,
        // do things in millisecs (num of nanosecs for duration scale)
        id: 0x2ad7b1 // TimecodeScale
      }, {
        data: 'whammy',
        id: 0x4d80 // MuxingApp
      }, {
        data: 'whammy',
        id: 0x5741 // WritingApp
      }, {
        data: (0,_base__WEBPACK_IMPORTED_MODULE_0__.doubleToString)(info.duration),
        id: 0x4489 // Duration
      }]
    }, {
      id: 0x1654ae6b,
      // Tracks
      data: [{
        id: 0xae,
        // TrackEntry
        data: [{
          data: 1,
          id: 0xd7 // TrackNumber
        }, {
          data: 1,
          id: 0x73c5 // TrackUID
        }, {
          data: 0,
          id: 0x9c // FlagLacing
        }, {
          data: 'und',
          id: 0x22b59c // Language
        }, {
          data: 'V_VP8',
          id: 0x86 // CodecID
        }, {
          data: 'VP8',
          id: 0x258688 // CodecName
        }, {
          data: 1,
          id: 0x83 // TrackType
        }, {
          id: 0xe0,
          // Video
          data: [{
            data: info.width,
            id: 0xb0 // PixelWidth
          }, {
            data: info.height,
            id: 0xba // PixelHeight
          }]
        }]
      }]
    }, {
      id: 0x1c53bb6b,
      // Cues
      data: [
        // cue insertion point
      ]
    }

    // cluster insertion point
    ]
  }];
  return EBML;
}

/***/ }),

/***/ "./node_modules/ts-whammy/src/libs/utils/imageSrcToWebpDataUrl.ts":
/*!************************************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/utils/imageSrcToWebpDataUrl.ts ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   imageSrcToWebpDataUrl: () => (/* binding */ imageSrcToWebpDataUrl)
/* harmony export */ });
const imageSrcToWebpDataUrl = (src, options) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = options?.width || img.width;
      canvas.height = options?.height || img.height;
      ctx.fillStyle = options?.backgroundColor || '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
      const webp = canvas.toDataURL("image/webp");
      resolve(webp);
    };
    img.onerror = error => {
      reject(error);
    };
  });
};

/***/ }),

/***/ "./node_modules/ts-whammy/src/libs/utils/makeSimpleBlock.ts":
/*!******************************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/utils/makeSimpleBlock.ts ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ makeSimpleBlock)
/* harmony export */ });
function makeSimpleBlock(data) {
  let flags = 0;
  if (data.keyframe) {
    flags |= 128;
  }
  if (data.invisible) {
    flags |= 8;
  }
  if (data.lacing) {
    flags |= data.lacing << 1;
  }
  if (data.discardable) {
    flags |= 1;
  }
  if (data.trackNum > 127) {
    throw new Error('TrackNumber > 127 not supported');
  }
  const out = [data.trackNum | 0x80, data.timecode >> 8, data.timecode & 0xff, flags].map(e => {
    return String.fromCharCode(e);
  }).join('') + data.frame;
  return out;
}

/***/ }),

/***/ "./node_modules/ts-whammy/src/libs/utils/parseRIFF2.ts":
/*!*************************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/utils/parseRIFF2.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ parseRIFF)
/* harmony export */ });
// https://github.com/antimatter15/whammy/issues/70
// https://github.com/Akimyou/ts-whammy/issues/29

function readUint32LittleEndian(buffer, offset) {
  const val = parseInt(buffer.substr(offset, 4).split('').map(i => {
    const unpadded = i.charCodeAt(0).toString(2);
    return new Array(8 - unpadded.length + 1).join('0') + unpadded;
  }).reverse().join(''), 2);
  return val;
}

/**
 * 对于 VP8X，需要提取出其中的 VP8 或 VP8L bit stream chunk。
 * 关于 VP8X 格式，参见 Extended file format: https://developers.google.com/speed/webp/docs/riff_container#extended_file_format
 * @param buffer VP8X Chunk数据，不含 'VP8X' tag
 */
function extractBitStreamFromVp8x(buffer) {
  /*
   32bit VP8X Chunk size
   8bit Flags: Rsv I L E X A R
   24bit Reserved
   24bit Canvas Width Minus One
   24bit Canvas Height Minus One
  */
  let offset = 4 + 1 + 3 + 3 + 3;
  while (offset < buffer.length) {
    const chunkTag = buffer.substr(offset, 4);
    offset += 4;
    const chunkSize = readUint32LittleEndian(buffer, offset);
    offset += 4;
    switch (chunkTag) {
      case 'VP8 ':
      case 'VP8L':
        // eslint-disable-next-line no-case-declarations
        const size = buffer.substr(offset - 4, 4);
        // eslint-disable-next-line no-case-declarations
        const body = buffer.substr(offset, chunkSize);
        return size + body;
      default:
        offset += chunkSize;
        break;
    }
  }
  throw new Error('VP8X format error: missing VP8/VP8L chunk.');
}
function parseRIFF(str) {
  let offset = 0;
  const chunks = {};
  while (offset < str.length) {
    const id = str.substr(offset, 4);
    chunks[id] = chunks[id] || [];
    if (id === 'RIFF' || id === 'LIST') {
      const len = readUint32LittleEndian(str, offset + 4);
      const data = str.substr(offset + 4 + 4, len);
      offset += 4 + 4 + len;
      chunks[id].push(parseRIFF(data));
    } else if (id === 'WEBP') {
      const vpVersion = str.substr(offset + 4, 4);
      switch (vpVersion) {
        case 'VP8X':
          chunks[id].push(extractBitStreamFromVp8x(str.substr(offset + 8)));
          break;
        case 'VP8 ':
        case 'VP8L':
          // Use (offset + 8) to skip past 'VP8 ' / 'VP8L' field after 'WEBP'
          chunks[id].push(str.substr(offset + 8));
          break;
        default:
          // eslint-disable-next-line no-console
          console.error(`not supported webp version: '${vpVersion}'`);
          break;
      }
      offset = str.length;
    } else {
      // Unknown chunk type push entire payload
      chunks[id].push(str.substr(offset + 4));
      offset = str.length;
    }
  }
  return chunks;
}

/***/ }),

/***/ "./node_modules/ts-whammy/src/libs/utils/parseWebP.ts":
/*!************************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/utils/parseWebP.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ parseWebP)
/* harmony export */ });
function parseWebP(riff) {
  const VP8 = riff.RIFF[0].WEBP[0];

  // A VP8 keyframe starts with the 0x9d012a header
  const frameStart = VP8.indexOf('\x9d\x01\x2a');
  const c = [];
  for (let i = 0; i < 4; i++) {
    c[i] = VP8.charCodeAt(frameStart + 3 + i);
  }

  // the code below is literally copied verbatim from the bit stream spec
  let tmp = c[1] << 8 | c[0];
  const width = tmp & 0x3FFF;
  // const horizontal_scale = tmp >> 14;
  tmp = c[3] << 8 | c[2];
  const height = tmp & 0x3FFF;
  // const vertical_scale = tmp >> 14;

  return {
    width,
    height,
    data: VP8,
    riff
  };
}

/***/ }),

/***/ "./node_modules/ts-whammy/src/libs/utils/toFlatArray.ts":
/*!**************************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/utils/toFlatArray.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ toFlatArray)
/* harmony export */ });
function toFlatArray(arr, outBuffer) {
  if (!outBuffer) {
    outBuffer = [];
  }
  for (const item of arr) {
    if (typeof item === 'object' && item[Symbol.iterator]) {
      toFlatArray(item, outBuffer);
    } else {
      outBuffer.push(item);
    }
  }
  return outBuffer;
}

/***/ }),

/***/ "./node_modules/ts-whammy/src/libs/utils/toWebM.ts":
/*!*********************************************************!*\
  !*** ./node_modules/ts-whammy/src/libs/utils/toWebM.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ toWebM)
/* harmony export */ });
/* harmony import */ var _getEBMLShell__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./getEBMLShell */ "./node_modules/ts-whammy/src/libs/utils/getEBMLShell.ts");
/* harmony import */ var _getEBMLCuePoint__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./getEBMLCuePoint */ "./node_modules/ts-whammy/src/libs/utils/getEBMLCuePoint.ts");
/* harmony import */ var _generateEBML__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./generateEBML */ "./node_modules/ts-whammy/src/libs/utils/generateEBML.ts");
/* harmony import */ var _checkFrames__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./checkFrames */ "./node_modules/ts-whammy/src/libs/utils/checkFrames.ts");
/* harmony import */ var _makeSimpleBlock__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./makeSimpleBlock */ "./node_modules/ts-whammy/src/libs/utils/makeSimpleBlock.ts");





function toWebM(frames, outputAsArray) {
  const info = (0,_checkFrames__WEBPACK_IMPORTED_MODULE_3__["default"])(frames);

  // max duration by cluster in milliseconds
  const CLUSTER_MAX_DURATION = 30000;
  const EBML = (0,_getEBMLShell__WEBPACK_IMPORTED_MODULE_0__["default"])(info);
  const segment = EBML[1];
  const cues = segment.data[2];

  // Generate clusters (max duration)
  let frameNumber = 0;
  let clusterTimecode = 0;
  while (frameNumber < frames.length) {
    const cuePoint = (0,_getEBMLCuePoint__WEBPACK_IMPORTED_MODULE_1__["default"])(clusterTimecode);
    cues.data.push(cuePoint);
    const clusterFrames = [];
    let clusterDuration = 0;
    do {
      clusterFrames.push(frames[frameNumber]);
      clusterDuration += frames[frameNumber].duration;
      frameNumber++;
    } while (frameNumber < frames.length && clusterDuration < CLUSTER_MAX_DURATION);
    let clusterCounter = 0;
    const clusterDataList = clusterFrames.map(webp => {
      const block = (0,_makeSimpleBlock__WEBPACK_IMPORTED_MODULE_4__["default"])({
        discardable: 0,
        frame: webp.data.slice(4),
        invisible: 0,
        keyframe: 1,
        lacing: 0,
        trackNum: 1,
        timecode: Math.round(clusterCounter)
      });
      clusterCounter += webp.duration;
      return {
        data: block,
        id: 0xa3
      };
    });
    const cluster = {
      id: 0x1f43b675,
      // Cluster
      data: [{
        data: Math.round(clusterTimecode),
        id: 0xe7 // Timecode
      }, ...clusterDataList]
    };

    // Add cluster to segment
    segment.data.push(cluster);
    clusterTimecode += clusterDuration;
  }

  // First pass to compute cluster positions
  let position = 0;
  for (let i = 0; i < segment.data.length; i++) {
    if (i >= 3) {
      cues.data[i - 3].data[1].data[1].data = position;
    }
    const data = (0,_generateEBML__WEBPACK_IMPORTED_MODULE_2__["default"])([segment.data[i]], outputAsArray);
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      position += data.size;
    }
    if (data instanceof Uint8Array) {
      position += data.byteLength;
    }
    if (i !== 2) {
      // not cues
      // Save results to avoid having to encode everything twice
      segment.data[i] = data;
    }
  }
  return (0,_generateEBML__WEBPACK_IMPORTED_MODULE_2__["default"])(EBML, outputAsArray);
}

/***/ }),

/***/ "./src/tsWhammyPatch.tsx":
/*!*******************************!*\
  !*** ./src/tsWhammyPatch.tsx ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getPatchedWhammy: () => (/* binding */ getPatchedWhammy)
/* harmony export */ });
/* harmony import */ var ts_whammy_src_libs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ts-whammy/src/libs */ "./node_modules/ts-whammy/src/libs/index.ts");
/* harmony import */ var ts_whammy_src_libs_utils_adaptor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ts-whammy/src/libs/utils/adaptor */ "./node_modules/ts-whammy/src/libs/utils/adaptor.ts");
/* harmony import */ var ts_whammy_src_libs_utils_parseRIFF2__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ts-whammy/src/libs/utils/parseRIFF2 */ "./node_modules/ts-whammy/src/libs/utils/parseRIFF2.ts");
/* harmony import */ var ts_whammy_src_libs_utils_parseWebP__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ts-whammy/src/libs/utils/parseWebP */ "./node_modules/ts-whammy/src/libs/utils/parseWebP.ts");
/* harmony import */ var ts_whammy_src_libs_utils_toWebM__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ts-whammy/src/libs/utils/toWebM */ "./node_modules/ts-whammy/src/libs/utils/toWebM.ts");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : String(i); }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }





console.warn("Applying whammy patch");

// We need the index of the error message here
//@ts-ignore
ts_whammy_src_libs__WEBPACK_IMPORTED_MODULE_0__["default"].modifiedFromImageArray = function (images, fps, updateProgress) {
  var curOutputAsArray = typeof Blob !== "undefined" ? false : true;
  var curFps = fps || 1;
  return (0,ts_whammy_src_libs_utils_toWebM__WEBPACK_IMPORTED_MODULE_4__["default"])(images.map(function (image, index) {
    updateProgress(index);
    try {
      var webp = (0,ts_whammy_src_libs_utils_parseWebP__WEBPACK_IMPORTED_MODULE_3__["default"])((0,ts_whammy_src_libs_utils_parseRIFF2__WEBPACK_IMPORTED_MODULE_2__["default"])((0,ts_whammy_src_libs_utils_adaptor__WEBPACK_IMPORTED_MODULE_1__.autoAtob)(image.slice(23))));
      var webpFrame = _objectSpread(_objectSpread({}, webp), {}, {
        duration: 1000 / curFps
      });
      return webpFrame;
    } catch (error) {
      console.error(error);
      throw new Error("Before toWebM Error, Image Index ".concat(index));
    }
  }), curOutputAsArray);
};
var getPatchedWhammy = function getPatchedWhammy() {
  return ts_whammy_src_libs__WEBPACK_IMPORTED_MODULE_0__["default"];
};

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!************************************!*\
  !*** ./src/Utils/whammy.worker.ts ***!
  \************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _tsWhammyPatch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../tsWhammyPatch */ "./src/tsWhammyPatch.tsx");


console.warn("Loading whammy worker");

onmessage = async (event) => {
  const { images, fps, updateProgress } = event.data;
  console.warn(
    "Whammy worker running!",
    images,
    fps,
    (0,_tsWhammyPatch__WEBPACK_IMPORTED_MODULE_0__.getPatchedWhammy)().fromImageArray
  );

  const callback = (index) => {
    postMessage({ type: "Progress", value: index });
  };

  const videoBlob = (0,_tsWhammyPatch__WEBPACK_IMPORTED_MODULE_0__.getPatchedWhammy)().modifiedFromImageArray(
    images,
    fps,
    callback
  );
  postMessage({ type: "Result", value: videoBlob });
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({}); // Add a default export to satisfy the linter

})();

/******/ })()
;
//# sourceMappingURL=bundle.worker.js.map