"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedState = void 0;
const testIsolation_1 = require("../socketLib/testIsolation");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis;
if (!g.__SHARED_STATE__) {
    g.__SHARED_STATE__ = {
        onlineUsers: new Set(),
        seed: testIsolation_1.seed,
    };
}
exports.sharedState = g.__SHARED_STATE__;
