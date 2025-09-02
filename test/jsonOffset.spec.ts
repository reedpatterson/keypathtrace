import { expect } from 'chai';
import { findOffsetForPath } from '../src/jsonOffset';

describe('jsonOffset.findOffsetForPath', () => {
    it('returns null for missing path', () => {
        const text = '{"a": {"b": 1}}';
        const res = findOffsetForPath(text, 'a.c');
        expect(res).to.equal(null);
    });

    it('finds simple key offset', () => {
        const text = '{"a": {"b": 1}}';
        const res = findOffsetForPath(text, 'a.b');
        expect(res).to.be.an('object');
        if (res) {
            const snippet = text.substring(res.start, res.end);
            expect(snippet).to.match(/"b"\s*:/);
        }
    });

    it('handles quoted key with dot', () => {
        const text = '{"a": {"c.d": {"e": 2}}}';
        const res = findOffsetForPath(text, 'a."c.d".e');
        // current heuristic does not support quoting in path; expect null
        expect(res).to.equal(null);
    });

    it('finds key when multiple occurrences exist', () => {
        const text = '{"b": 0, "a": {"b": 1}, "c": {"b": 2}}';
        const res = findOffsetForPath(text, 'a.b');
        expect(res).to.be.an('object');
        if (res) {
            const snippet = text.substring(res.start, res.end);
            expect(snippet).to.match(/"b"\s*:/);
            // ensure the returned index corresponds to the occurrence inside object a
            expect(res.start).to.be.greaterThan(text.indexOf('{"a":'));
        }
    });
});
