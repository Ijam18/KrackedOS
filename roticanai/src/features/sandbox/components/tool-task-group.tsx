import {
  FileIcon,
  FolderIcon,
  PencilIcon,
  SparklesIcon,
  TerminalIcon,
  XCircleIcon,
} from "lucide-react";
import { TaskItemFile } from "@/components/ai-elements/task";
import { Spinner } from "@/components/ui/spinner";

interface ToolTaskGroupProps {
  tools: Array<Record<string, unknown>>;
}

export function ToolTaskGroup({ tools }: ToolTaskGroupProps) {
  return (
    <div className="my-3 space-y-1 border-l-4 border-border pl-3">
      {tools.map((tool) => {
        const info = getToolInfo(tool);
        const status = getStatus(tool);
        const Icon = info.icon;
        const toolCallId = (tool.toolCallId as string) || String(Math.random());
        const statusIcon = getStatusIcon(status);

        return (
          <div
            key={toolCallId}
            className="flex items-center gap-2 text-sm font-mono"
          >
            {statusIcon}
            <Icon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground uppercase text-xs">
              {info.title}
            </span>
            {"file" in info && info.file && (
              <TaskItemFile>
                <FileIcon className="size-3" />
                <span className="text-foreground">{info.file}</span>
              </TaskItemFile>
            )}
            {"command" in info && info.command && (
              <code className="border-2 border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                {info.command}
              </code>
            )}
            {status === "error" && typeof tool.errorText === "string" && (
              <span className="text-xs text-destructive">
                ! {tool.errorText}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getToolInfo(tool: Record<string, unknown>) {
  const toolType = tool.type as string;
  const toolName = toolType.startsWith("tool-") ? toolType.slice(5) : "unknown";
  const toolInput = (tool.input as Record<string, unknown>) || {};

  switch (toolName) {
    case "readFile":
      return {
        title: "Read",
        icon: FileIcon,
        file: toolInput.path as string,
      };
    case "writeFile":
      return {
        title: "Write",
        icon: PencilIcon,
        file: toolInput.path as string,
      };
    case "listFiles":
      return {
        title: "List",
        icon: FolderIcon,
        file: (toolInput.path as string) || ".",
      };
    case "runCommand":
      return {
        title: "Run",
        icon: TerminalIcon,
        command: toolInput.command as string,
      };
    default:
      return {
        title: toolName,
        icon: SparklesIcon,
      };
  }
}

function getStatus(tool: Record<string, unknown>) {
  const state = tool.state as string;
  if (state === "output-available") return "completed";
  if (state === "output-error") return "error";
  return "pending";
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return null;
    case "error":
      return <XCircleIcon className="size-4 text-destructive" />;
    default:
      return <Spinner className="size-4 text-foreground" />;
  }
}
