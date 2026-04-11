package memory

import (
	"context"
	"testing"
)

type fakeProvider struct {
	resp  string
	calls []ToolCall
}

func (f *fakeProvider) Chat(ctx context.Context, messages []Message, tools []ToolDefinition, model string) (LLMResponse, error) {
	if len(f.calls) > 0 {
		return LLMResponse{Content: "", HasToolCalls: true, ToolCalls: f.calls}, nil
	}
	return LLMResponse{Content: f.resp, HasToolCalls: false}, nil
}
func (f *fakeProvider) GetDefaultModel() string { return "test-model" }

func TestLLMRankerUsesProvider(t *testing.T) {
	mems := []MemoryItem{{Kind: "short", Text: "buy milk"}, {Kind: "short", Text: "call mom"}}
	p := &fakeProvider{calls: []ToolCall{{ID: "1", Name: "rank_memories", Arguments: map[string]interface{}{"indices": []int{1, 0}}}}}
	r := NewLLMRanker(p, "test-model")
	res := r.Rank("milk", mems, 2)
	if len(res) != 2 {
		t.Fatalf("expected 2 results, got %d", len(res))
	}
	if res[0].Text != "call mom" {
		t.Fatalf("expected first result to be 'call mom', got %q", res[0].Text)
	}
}
