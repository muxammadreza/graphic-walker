import { syntaxHighlightSegments } from './syntaxHighlight';

describe('syntaxHighlightSegments', () => {
    it('treats dangerous html text as plain text content', () => {
        const payload = { value: '<img src=x onerror=alert(1)>' };
        const segments = syntaxHighlightSegments(payload);
        const joined = segments.map((segment) => segment.text).join('');

        expect(joined).toContain('<img src=x onerror=alert(1)>');
        expect(joined).not.toContain('<span');
        expect(joined).not.toContain('&lt;');
    });

    it('labels key and string tokens with different classes', () => {
        const segments = syntaxHighlightSegments({ key: 'value' });
        const hasKey = segments.some((segment) => segment.className.includes('text-purple-500') && segment.text.includes('"key"'));
        const hasString = segments.some((segment) => segment.className.includes('text-emerald-500') && segment.text.includes('"value"'));

        expect(hasKey).toBe(true);
        expect(hasString).toBe(true);
    });
});
