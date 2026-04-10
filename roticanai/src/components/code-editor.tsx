"use client";

import type { Workspace } from "modern-monaco";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { githubDarkTheme } from "@/lib/ui/themes";
import { cn } from "@/lib/ui/utils";

type Monaco = Awaited<ReturnType<typeof import("modern-monaco").init>>;
type MonacoEditor = ReturnType<Monaco["editor"]["create"]>;

export interface CodeEditorHandle {
  getValue: () => string | undefined;
  setValue: (value: string) => void;
  focus: () => void;
  getEditor: () => MonacoEditor | null;
}

export interface CodeEditorProps {
  path?: string;
  defaultValue?: string;
  onChange?: (value: string | undefined) => void;
  onSave?: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** When provided, enables LSP features (intellisense, error checking, etc.) */
  workspace?: Workspace;
}

function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    less: "less",
    md: "markdown",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    svg: "xml",
    sh: "shell",
    bash: "shell",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
  };
  return languageMap[ext ?? ""] ?? "plaintext";
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor(
    {
      path,
      defaultValue,
      onChange,
      onSave,
      language,
      readOnly = false,
      className,
      style,
      workspace,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<MonacoEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const onChangeRef = useRef(onChange);
    const onSaveRef = useRef(onSave);
    const workspaceRef = useRef(workspace);

    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
    workspaceRef.current = workspace;

    useImperativeHandle(
      ref,
      () => ({
        getValue: () => editorRef.current?.getValue(),
        setValue: (val: string) => editorRef.current?.setValue(val),
        focus: () => editorRef.current?.focus(),
        getEditor: () => editorRef.current,
      }),
      [],
    );

    // Track initial values to avoid re-initialization on prop updates
    // updates are handled by separate effects
    const initialConfig = useRef({
      defaultValue,
      language,
      path,
      readOnly,
    });

    useEffect(() => {
      if (!containerRef.current) return;

      let disposed = false;
      let editor: MonacoEditor | null = null;

      const initEditor = async () => {
        const hasWorkspace = !!workspace;

        const { init } = hasWorkspace
          ? await import("modern-monaco")
          : await import("modern-monaco/core");

        if (disposed) return;

        const monaco = await init({
          theme: githubDarkTheme,
          ...(hasWorkspace && {
            workspace,
            lsp: {
              typescript: {
                compilerOptions: {
                  target: 99, // ESNext
                  module: 99, // ESNext
                  jsx: 4, // react-jsx
                  strict: true,
                  esModuleInterop: true,
                  skipLibCheck: true,
                  moduleResolution: 100, // Bundler
                },
              },
            },
          }),
        });
        monacoRef.current = monaco;

        if (disposed || !containerRef.current) return;

        const {
          defaultValue: initialValue,
          language: initialLanguage,
          path: initialPath,
          readOnly: initialReadOnly,
        } = initialConfig.current;

        const detectedLanguage = initialPath
          ? getLanguageFromPath(initialPath)
          : "plaintext";

        editor = monaco.editor.create(containerRef.current, {
          value: initialValue ?? "",
          language: initialLanguage ?? detectedLanguage,
          automaticLayout: true,
          readOnly: initialReadOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'Monaco, Menlo, "Courier New", monospace',
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
          padding: { top: 8, bottom: 8 },
        });

        editorRef.current = editor;

        if (hasWorkspace && initialPath) {
          await workspace.openTextDocument(initialPath);
        }

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          onSaveRef.current?.(editorRef.current?.getValue());
        });

        editor.onDidChangeModelContent(() => {
          onChangeRef.current?.(editorRef.current?.getValue());
        });

        setIsLoading(false);
      };

      initEditor();

      return () => {
        disposed = true;
        editor?.dispose();
      };
    }, [workspace]);

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;

      const detectedLanguage = path ? getLanguageFromPath(path) : "plaintext";
      const model = editor.getModel();
      if (model && monacoRef.current) {
        monacoRef.current.editor.setModelLanguage(
          model,
          language ?? detectedLanguage,
        );
      }

      // If workspace is available and path changes, open the new document
      if (workspace && path) {
        workspace.openTextDocument(path);
      }
    }, [path, language, workspace]);

    useEffect(() => {
      editorRef.current?.updateOptions({ readOnly });
    }, [readOnly]);

    return (
      <div className={cn("relative h-full w-full", className)} style={style}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#24292e] text-[#666]">
            Loading editor...
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    );
  },
);
