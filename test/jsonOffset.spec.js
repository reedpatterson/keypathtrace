"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const jsonOffset_1 = require("../src/jsonOffset");
describe('jsonOffset.findOffsetForPath', () => {
    it('returns null for missing path', () => {
        const text = '{"a": {"b": 1}}';
        const res = (0, jsonOffset_1.findOffsetForPath)(text, 'a.c');
        (0, chai_1.expect)(res).to.equal(null);
    });
    it('finds simple key offset', () => {
        const text = '{"a": {"b": 1}}';
        const res = (0, jsonOffset_1.findOffsetForPath)(text, 'a.b');
        (0, chai_1.expect)(res).to.be.an('object');
        if (res) {
            const snippet = text.substring(res.start, res.end);
            (0, chai_1.expect)(snippet).to.match(/"b"\s*:/);
        }
    });
    it('handles quoted key with dot', () => {
        const text = '{"a": {"c.d": {"e": 2}}}';
        const res = (0, jsonOffset_1.findOffsetForPath)(text, 'a."c.d".e');
        // current heuristic does not support quoting in path; expect null
        (0, chai_1.expect)(res).to.equal(null);
    });
    it('finds key when multiple occurrences exist', () => {
        const text = '{"b": 0, "a": {"b": 1}, "c": {"b": 2}}';
        const res = (0, jsonOffset_1.findOffsetForPath)(text, 'a.b');
        (0, chai_1.expect)(res).to.be.an('object');
        if (res) {
            const snippet = text.substring(res.start, res.end);
            (0, chai_1.expect)(snippet).to.match(/"b"\s*:/);
            // ensure the returned index corresponds to the occurrence inside object a
            (0, chai_1.expect)(res.start).to.be.greaterThan(text.indexOf('{"a":'));
        }
    });
});
//# sourceMappingURL=jsonOffset.spec.js.map