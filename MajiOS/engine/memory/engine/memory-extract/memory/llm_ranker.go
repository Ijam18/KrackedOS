package memory

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
)

// LLMMemoryRanker uses an LLM provider to rank memories.
type LLMMemoryRanker struct {
	provider LLMProvider
	model    string
	fallback *SimpleRanker
	logger   *log.Logger
}

func NewLLMRanker(provider LLMProvider, model string) *LLMMemoryRanker {
	return NewLLMRankerWithLogger(provider, model, nil)
}

func NewLLMRankerWithLogger(provider LLMProvider, model string, logger *log.Logger) *LLMMemoryRanker {
	if model == "" && provider != nil {
		model = provider.GetDefaultModel()
	}
	return &LLMMemoryRanker{provider: provider, model: model, fallback: NewSimpleRanker(), logger: logger}
}

func (r *LLMMemoryRanker) logf(format string, args ...interface{}) {
	if r.logger != nil {
		r.logger.Printf(format, args...)
	} else {
		log.Printf(format, args...)
	}
}

func (r *LLMMemoryRanker) Rank(query string, memories []MemoryItem, top int) []MemoryItem {
	return r.RankWithContext(context.Background(), query, memories, top)
}

// RankWithContext allows callers to propagate cancellation/timeouts to provider calls.
func (r *LLMMemoryRanker) RankWithContext(ctx context.Context, query string, memories []MemoryItem, top int) []MemoryItem {
	if len(memories) == 0 || top <= 0 {
		return nil
	}
	if r.provider == nil {
		return r.fallback.Rank(query, memories, top)
	}

	var sb strings.Builder
	sb.WriteString("You are a ranking assistant. Given the query and a list of memories numbered 0..N-1, return only an ordered list of indices (most relevant first). Respond either by calling the tool 'rank_memories' with argument {\"indices\": [i, j, ...]} or by returning a JSON array like [i,j,...].\n\n")
	sb.WriteString("Query: " + query + "\n\n")
	sb.WriteString("Memories (index: text):\n")
	for i, m := range memories {
		sb.WriteString(fmt.Sprintf("%d: %s\n", i, m.Text))
	}

	messages := []Message{{Role: "system", Content: sb.String()}, {Role: "user", Content: "Return an ordered list of indices ranked by relevance, or call rank_memories."}}
	rankTool := ToolDefinition{
		Name:        "rank_memories",
		Description: "Return ranking indices for memories",
		Parameters: map[string]interface{}{
			"type":     "object",
			"required": []string{"indices"},
			"properties": map[string]interface{}{
				"indices": map[string]interface{}{"type": "array", "items": map[string]interface{}{"type": "number"}},
			},
		},
	}

	r.logf("LLMMemoryRanker: query=%q memories=%d", query, len(memories))
	resp, err := r.provider.Chat(ctx, messages, []ToolDefinition{rankTool}, r.model)
	if err != nil {
		r.logf("LLMMemoryRanker provider error: %v", err)
		return r.fallback.Rank(query, memories, top)
	}

	if resp.HasToolCalls && len(resp.ToolCalls) > 0 {
		for _, tc := range resp.ToolCalls {
			if tc.Name != "rank_memories" {
				continue
			}
			if raw, ok := tc.Arguments["indices"]; ok {
				if idxs, err := parseIndicesFromArgs(raw); err == nil {
					return selectAndPad(memories, idxs, top, r.fallback.Rank(query, memories, len(memories)))
				}
			}
		}
	}

	var idxs []int
	body := strings.TrimSpace(resp.Content)
	if err := json.Unmarshal([]byte(body), &idxs); err != nil {
		if err2 := parseIndicesFromText(body, &idxs); err2 != nil {
			r.logf("LLMMemoryRanker parse error: %v", err2)
			return r.fallback.Rank(query, memories, top)
		}
	}
	return selectAndPad(memories, idxs, top, r.fallback.Rank(query, memories, len(memories)))
}

func selectAndPad(memories []MemoryItem, idxs []int, top int, fallback []MemoryItem) []MemoryItem {
	out := make([]MemoryItem, 0, top)
	seen := make(map[int]struct{})
	for _, idx := range idxs {
		if idx < 0 || idx >= len(memories) {
			continue
		}
		if _, ok := seen[idx]; ok {
			continue
		}
		out = append(out, memories[idx])
		seen[idx] = struct{}{}
		if len(out) >= top {
			break
		}
	}
	if len(out) >= top {
		return out
	}
	for _, m := range fallback {
		if len(out) >= top {
			break
		}
		skip := false
		for _, s := range out {
			if s.Text == m.Text && s.Kind == m.Kind {
				skip = true
				break
			}
		}
		if !skip {
			out = append(out, m)
		}
	}
	return out
}

func parseIndicesFromText(s string, out *[]int) error {
	start := strings.Index(s, "[")
	end := strings.LastIndex(s, "]")
	if start == -1 || end == -1 || start >= end {
		return ErrNoIndicesFound
	}
	sub := s[start : end+1]
	return json.Unmarshal([]byte(sub), out)
}

func parseIndicesFromArgs(v interface{}) ([]int, error) {
	switch t := v.(type) {
	case []int:
		return t, nil
	case []float64:
		out := make([]int, len(t))
		for i, f := range t {
			out[i] = int(f)
		}
		return out, nil
	case []interface{}:
		out := make([]int, 0, len(t))
		for _, it := range t {
			switch x := it.(type) {
			case float64:
				out = append(out, int(x))
			case int:
				out = append(out, x)
			case int64:
				out = append(out, int(x))
			}
		}
		if len(out) == 0 {
			return nil, ErrNoIndicesFound
		}
		return out, nil
	default:
		return nil, ErrNoIndicesFound
	}
}
