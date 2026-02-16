export interface HighlightSegment {
    text: string;
    className: string;
}

const tokenRegex =
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;

function classifyToken(match: string): string {
    if (match.startsWith('"')) {
        return match.endsWith(':') ? 'text-purple-500' : 'text-emerald-500';
    }
    if (match === 'true' || match === 'false') {
        return 'text-blue-500';
    }
    return 'text-sky-500';
}

export function syntaxHighlightSegments(value: unknown): HighlightSegment[] {
    const source = typeof value === 'string' ? value : JSON.stringify(value, undefined, 4);
    const text = source ?? '';
    const segments: HighlightSegment[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
        const [token] = match;
        const index = match.index;

        if (index > cursor) {
            segments.push({
                text: text.slice(cursor, index),
                className: 'text-foreground',
            });
        }

        segments.push({
            text: token,
            className: classifyToken(token),
        });
        cursor = index + token.length;
    }

    if (cursor < text.length) {
        segments.push({
            text: text.slice(cursor),
            className: 'text-foreground',
        });
    }

    return segments.length > 0
        ? segments
        : [
              {
                  text,
                  className: 'text-foreground',
              },
          ];
}
