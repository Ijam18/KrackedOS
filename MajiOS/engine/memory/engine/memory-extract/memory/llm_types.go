package memory

import "context"

// Message represents a chat message to/from the LLM.
type Message struct {
	Role       string     `json:"role"`
	Content    string     `json:"content"`
	ToolCallID string     `json:"tool_call_id,omitempty"`
	ToolCalls  []ToolCall `json:"tool_calls,omitempty"`
}

// ToolDefinition describes a tool exposed to the model.
type ToolDefinition struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Parameters  map[string]interface{} `json:"parameters,omitempty"`
}

// ToolCall is a provider request to invoke a tool.
type ToolCall struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

// LLMResponse is a normalized provider response.
type LLMResponse struct {
	Content      string     `json:"content"`
	HasToolCalls bool       `json:"hasToolCalls"`
	ToolCalls    []ToolCall `json:"toolCalls,omitempty"`
}

// LLMProvider is the optional interface used by LLMMemoryRanker.
type LLMProvider interface {
	Chat(ctx context.Context, messages []Message, tools []ToolDefinition, model string) (LLMResponse, error)
	GetDefaultModel() string
}
