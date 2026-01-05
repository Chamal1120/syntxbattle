<script lang="ts">
    /**
     * Syntxbattle - CodeMirror Editor Component
     *
     * @description
     * Code editor with Vague themed syntax highlighting powered by CodeMirror 6
     *
     * @author Chamal Mallawaarachchi
     */
    import { onMount } from 'svelte';
    import { EditorView, basicSetup } from 'codemirror';
    import { javascript } from '@codemirror/lang-javascript';
    //import { EditorState } from '@codemirror/state';
    import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
    import { tags } from '@lezer/highlight';

    interface EditorProps {
        value: string;
        onchange?: (value: string) => void;
        disabled?: boolean;
    }

    let { value = $bindable(''), onchange, disabled = false }: EditorProps = $props();

    let container: HTMLDivElement;
    let view: EditorView;

    // Vague theme for CM6
    const syntaxTheme = HighlightStyle.define([
        { tag: tags.keyword, color: '#6e94b2' }, 
        { tag: tags.controlKeyword, color: '#6e94b2' }, 
        { tag: tags.operatorKeyword, color: '#6e94b2' }, 
        { tag: tags.definitionKeyword, color: '#6e94b2' }, 
        { tag: tags.modifier, color: '#6e94b2' }, 
        
        { tag: tags.function(tags.variableName), color: '#d8647e' }, 
        { tag: tags.function(tags.propertyName), color: '#d8647e' }, 
        
        { tag: tags.string, color: '#f3be7c' }, 
        { tag: tags.number, color: '#f3be7c' }, 
        { tag: tags.bool, color: '#f3be7c' }, 
        { tag: tags.null, color: '#f3be7c' }, 
        
        { tag: tags.variableName, color: '#cdcdcd' }, 
        { tag: tags.propertyName, color: '#aeaed1' }, 
        { tag: tags.definition(tags.variableName), color: '#cdcdcd' }, 
        
        { tag: tags.comment, color: '#606079', fontStyle: 'italic' }, 
        { tag: tags.lineComment, color: '#606079', fontStyle: 'italic' },
        { tag: tags.blockComment, color: '#606079', fontStyle: 'italic' },
        
        { tag: tags.operator, color: '#aeaed1' }, 
        { tag: tags.punctuation, color: '#cdcdcd' }, 
        { tag: tags.bracket, color: '#cdcdcd' },
        
        { tag: tags.className, color: '#7fa563' }, 
        { tag: tags.typeName, color: '#7fa563' }, 
        
        { tag: tags.regexp, color: '#d8647e' }, 
        { tag: tags.escape, color: '#d8647e' }, 
    ]);

    onMount(() => {
        view = new EditorView({
            doc: value,
            extensions: [
                basicSetup,
                javascript(),
                syntaxHighlighting(syntaxTheme),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const newValue = update.state.doc.toString();
                        value = newValue;
                        onchange?.(newValue);
                    }
                }),
                EditorView.theme({
                    '&': {
                        height: '100%',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--fg-main)',
                    },
                    '.cm-content': {
                        caretColor: 'var(--accent)',
                        fontFamily: "'Fira Code', monospace",
                        fontSize: '1rem',
                    },
                    '.cm-gutters': {
                        backgroundColor: 'var(--bg-inactive)',
                        color: 'var(--comment)',
                        border: 'none',
                    },
                    '.cm-activeLineGutter': {
                        backgroundColor: 'transparent',
                    },
                    '.cm-activeLine': {
                        backgroundColor: 'rgba(180, 212, 207, 0.05)',
                    },
                    '.cm-selectionBackground, ::selection': {
                        backgroundColor: 'var(--selection) !important',
                    },
                    '&.cm-focused .cm-selectionBackground, &.cm-focused ::selection': {
                        backgroundColor: 'var(--selection) !important',
                    },
                    '.cm-cursor': {
                        borderLeftColor: 'var(--accent)',
                    },
                    // Autocomplete menu theming
                    '.cm-tooltip': {
                        backgroundColor: '#252530',
                        border: '1px solid #606079',
                        color: '#cdcdcd',
                    },
                    '.cm-tooltip-autocomplete': {
                        backgroundColor: '#252530',
                        '& > ul': {
                            fontFamily: "'Fira Code', monospace",
                        },
                        '& > ul > li': {
                            color: '#cdcdcd',
                        },
                        '& > ul > li[aria-selected]': {
                            backgroundColor: '#606079',
                            color: '#cdcdcd',
                        },
                    },
                    '.cm-completionLabel': {
                        color: '#cdcdcd',
                    },
                    '.cm-completionDetail': {
                        color: '#aeaed1',
                        fontStyle: 'italic',
                    },
                    '.cm-completionMatchedText': {
                        color: '#7fa563',
                        textDecoration: 'none',
                    },
                    // Diagnostic/lint tooltips
                    '.cm-diagnostic': {
                        backgroundColor: '#252530',
                        border: '1px solid #d8647e',
                        color: '#cdcdcd',
                    },
                    '.cm-diagnostic-error': {
                        borderLeftColor: '#d8647e',
                    },
                    '.cm-diagnostic-warning': {
                        borderLeftColor: '#f3be7c',
                    },
                }),
                EditorView.editable.of(!disabled),
            ],
            parent: container,
        });

        return () => {
            view?.destroy();
        };
    });

    $effect(() => {
        if (view && value !== view.state.doc.toString()) {
            view.dispatch({
                changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: value,
                },
            });
        }
    });
</script>

<div class="editor-wrapper" bind:this={container}></div>

<style>
    .editor-wrapper {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .editor-wrapper :global(.cm-editor) {
        height: 100%;
    }

    .editor-wrapper :global(.cm-scroller) {
        overflow: auto;
    }
</style>
