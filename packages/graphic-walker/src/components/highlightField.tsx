import React from 'react';

export interface TextFieldProps {
    placeholder?: string;
    onChange?: (v: string) => void;
    value: string;
}

export function highlightField(highlighter: (value: string) => string) {
    return React.forwardRef<HTMLDivElement, TextFieldProps>(function TextField({ placeholder, onChange, value }, ref) {
        const highlightValue = highlighter(value);
        const editorRef = React.useRef<HTMLDivElement>(null);

        React.useImperativeHandle(ref, () => editorRef.current as HTMLDivElement, []);

        React.useEffect(() => {
            if (editorRef.current && editorRef.current.textContent !== value) {
                editorRef.current.textContent = value;
            }
        }, [value]);

        return (
            <div className="relative flex min-h-[60px] w-full rounded-md border border-input bg-transparent text-sm shadow-sm">
                <div className="absolute whitespace-pre-wrap break-words inset-0 pointer-events-none px-3 py-2">{highlightValue}</div>
                {placeholder && value === '' && (
                    <div className="px-3 py-2 pointer-events-none text-muted-foreground absolute inset-0 select-none">{placeholder}</div>
                )}
                <div
                    ref={editorRef}
                    contentEditable="plaintext-only"
                    onInput={(e) => {
                        const text = e.currentTarget.textContent ?? '';
                        onChange?.(text);
                    }}
                    className="px-3 py-2 w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 rounded-md border-0 text-transparent caret-foreground"
                ></div>
            </div>
        );
    });
}
