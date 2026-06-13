import React, { useEffect, useRef, useState } from 'react';

// Dynamically load Quill CSS from CDN
const loadQuillCSS = () => {
    if (!document.getElementById('quill-css')) {
        const link = document.createElement('link');
        link.id = 'quill-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
        document.head.appendChild(link);
    }
};

// Dynamically load Quill JS from CDN
const loadQuillJS = (callback: () => void) => {
    if (!(window as any).Quill) {
        const script = document.createElement('script');
        script.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    } else {
        callback();
    }
};

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<any>(null); // Use 'any' for Quill instance
    const onChangeRef = useRef(onChange);
    const [isQuillLoaded, setIsQuillLoaded] = useState(false);

    // Keep the ref updated with the latest onChange from props
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        loadQuillCSS();
        loadQuillJS(() => setIsQuillLoaded(true));
    }, []);

    useEffect(() => {
        if (isQuillLoaded && editorRef.current && !quillRef.current) {
            const toolbarOptions = [
                ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme (removed image)
                [{ 'align': [] }],
                ['link'],                                         // link only
                ['clean']                                         // remove formatting button
            ];

            quillRef.current = new (window as any).Quill(editorRef.current, {
                theme: 'snow',
                placeholder: placeholder || 'Enter paragraph text...',
                modules: {
                    toolbar: toolbarOptions
                }
            });

            quillRef.current.on('text-change', () => {
                if (quillRef.current) {
                    const html = quillRef.current.root.innerHTML;
                    // Normalize empty content from Quill's '<p><br></p>' or '<p></p>' to ''
                    onChangeRef.current(html === '<p><br></p>' || html === '<p></p>' ? '' : html);
                }
            });

            // Set initial content, but only if it's not Quill's default empty state
            if (value && value !== '<p><br></p>' && value !== '<p></p>') {
                quillRef.current.root.innerHTML = value;
            }
        }
    }, [isQuillLoaded, onChange, placeholder, value]);

    // Update Quill's content when the `value` prop changes externally
    useEffect(() => {
        if (quillRef.current && value !== quillRef.current.root.innerHTML && value !== '<p><br></p>' && value !== '<p></p>') {
            quillRef.current.root.innerHTML = value;
        }
    }, [value]);

    return (
        <div style={{ border: '1px solid #e1e3e5', borderRadius: '8px', overflow: 'hidden' }}>
            <style>
                {`
                    .ql-container.ql-snow { border: none !important; }
                    .ql-toolbar.ql-snow {
                        border: 0;
                        border-bottom: 1px solid #ccc;
                    }
                    .ql-editor { 
                        min-height: 300px; 
                        font-size: 13px; 
                    }
                `}
            </style>
            <div ref={editorRef} />
        </div>
    );
};