"use client";

import type { FileSystemTree } from "@webcontainer/api";
import { ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import { FileIcon, FolderIcon } from "@/lib/ui/file-icons";
import { cn } from "@/lib/ui/utils";

export interface FileTreeProps {
  /** FileSystemTree from WebContainer */
  files: FileSystemTree;
  /** Currently selected file path */
  selectedPath?: string;
  /** Called when a file is selected */
  onSelect?: (path: string) => void;
  /** Additional CSS class */
  className?: string;
}

interface TreeNodeProps {
  name: string;
  path: string;
  node: FileSystemTree[string];
  selectedPath?: string;
  onSelect?: (path: string) => void;
  depth: number;
}

function TreeNode({
  name,
  path,
  node,
  selectedPath,
  onSelect,
  depth,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0);

  const isDirectory = "directory" in node;
  const isSelected = path === selectedPath;

  const handleClick = useCallback(() => {
    if (isDirectory) {
      setExpanded((prev) => !prev);
    } else {
      onSelect?.(path);
    }
  }, [isDirectory, onSelect, path]);

  const paddingLeft = 8 + depth * 16;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex w-full items-center gap-1 py-1 text-left text-sm font-mono transition-all",
          "hover:bg-primary/10 hover:text-primary",
          isSelected && "bg-primary/20 text-primary border-l-2 border-primary",
        )}
        style={{ paddingLeft }}
      >
        {isDirectory ? (
          <>
            <ChevronRight
              className={cn(
                "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
                expanded && "rotate-90 text-primary",
              )}
            />
            <FolderIcon
              folderName={name}
              isOpen={expanded}
              className="shrink-0"
              size={16}
            />
          </>
        ) : (
          <>
            <span className="w-3" /> {/* Spacer for alignment */}
            <FileIcon filename={name} className="shrink-0" size={16} />
          </>
        )}
        <span className="truncate text-foreground">{name}</span>
      </button>

      {isDirectory && expanded && (
        <div className="border-l border-border/50 ml-2">
          {Object.entries(node.directory)
            .sort(([aName, aNode], [bName, bNode]) => {
              // Directories first, then files
              const aIsDir = "directory" in aNode;
              const bIsDir = "directory" in bNode;
              if (aIsDir && !bIsDir) return -1;
              if (!aIsDir && bIsDir) return 1;
              return aName.localeCompare(bName);
            })
            .map(([childName, childNode]) => (
              <TreeNode
                key={childName}
                name={childName}
                path={path ? `${path}/${childName}` : childName}
                node={childNode}
                selectedPath={selectedPath}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({
  files,
  selectedPath,
  onSelect,
  className,
}: FileTreeProps) {
  // Sort entries: directories first, then files alphabetically
  const sortedEntries = Object.entries(files).sort(
    ([aName, aNode], [bName, bNode]) => {
      const aIsDir = "directory" in aNode;
      const bIsDir = "directory" in bNode;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return aName.localeCompare(bName);
    },
  );

  return (
    <div className={cn("h-full overflow-auto text-sm select-none", className)}>
      <div className="py-1">
        {sortedEntries.map(([name, node]) => (
          <TreeNode
            key={name}
            name={name}
            path={name}
            node={node}
            selectedPath={selectedPath}
            onSelect={onSelect}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}
