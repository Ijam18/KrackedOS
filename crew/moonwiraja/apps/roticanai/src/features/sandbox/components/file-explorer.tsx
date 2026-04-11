"use client";

import {
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  Loader2Icon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/ui/utils";
import type { FileTreeNode } from "../hooks/use-sandbox-files";

// File icon based on extension
function getFileIconColor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const colorMap: Record<string, string> = {
    js: "text-yellow-400",
    jsx: "text-cyan-400",
    ts: "text-blue-400",
    tsx: "text-blue-400",
    css: "text-purple-400",
    scss: "text-pink-400",
    html: "text-orange-400",
    json: "text-yellow-300",
    md: "text-gray-400",
    py: "text-green-400",
    gitignore: "text-gray-500",
  };
  return colorMap[ext] || "text-muted-foreground";
}

interface FileExplorerProps {
  files: FileTreeNode[];
  isLoading: boolean;
  onFileSelect: (path: string) => void;
  selectedFile?: string | null;
}

export function FileExplorer({
  files,
  isLoading,
  onFileSelect,
  selectedFile,
}: FileExplorerProps) {
  if (isLoading && files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-primary">
          <Loader2Icon className="h-4 w-4 animate-spin" />
          <span className="text-sm font-mono ">SCANNING</span>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <FolderIcon className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground font-mono">
          NO FILES FOUND
        </p>
        <p className="text-xs text-muted-foreground/60 font-mono">
          START QUEST TO CREATE
        </p>
      </div>
    );
  }

  return (
    <div className="py-1 font-mono">
      {files.map((node) => (
        <FileTreeItem
          key={node.path}
          node={node}
          depth={0}
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
        />
      ))}
    </div>
  );
}

interface FileTreeItemProps {
  node: FileTreeNode;
  depth: number;
  onFileSelect: (path: string) => void;
  selectedFile?: string | null;
}

function FileTreeItem({
  node,
  depth,
  onFileSelect,
  selectedFile,
}: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const isSelected = selectedFile === node.path;

  const handleClick = () => {
    if (node.isDir) {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node.path);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex w-full items-center gap-1 py-1 text-sm transition-all",
          "text-left hover:bg-primary/10 hover:text-primary",
          isSelected && "bg-primary/20 text-primary border-l-2 border-primary",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.isDir ? (
          <ChevronRightIcon
            className={cn(
              "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform",
              isExpanded && "rotate-90 text-primary",
            )}
          />
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        {node.isDir ? (
          isExpanded ? (
            <FolderOpenIcon className="h-4 w-4 flex-shrink-0 text-primary" />
          ) : (
            <FolderIcon className="h-4 w-4 flex-shrink-0 text-primary/70" />
          )
        ) : (
          <FileIcon
            className={cn("h-4 w-4 flex-shrink-0", getFileIconColor(node.name))}
          />
        )}
        <span className="truncate text-foreground">{node.name}</span>
      </button>
      {node.isDir && isExpanded && node.children && (
        <div className="border-l border-border/30 ml-3">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
