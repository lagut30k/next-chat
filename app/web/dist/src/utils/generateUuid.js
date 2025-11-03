"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUuid = generateUuid;
function generateUuid() {
    return crypto.randomUUID();
}
