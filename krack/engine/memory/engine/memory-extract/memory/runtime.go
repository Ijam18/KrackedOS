package memory

import (
	"fmt"
	"strings"
	"time"
)

const maxTurnMessageBytes = 16 * 1024

// ProjectMemoryRuntime is a drop-in adapter for AI agent loops.
type ProjectMemoryRuntime struct {
	Store      *MemoryStore
	Ranker     Ranker
	TopK       int
	RecentDays int
}

// NewProjectMemoryRuntime creates a memory runtime rooted at projectRoot.
func NewProjectMemoryRuntime(projectRoot string, shortLimit, topK, recentDays int, ranker Ranker) (*ProjectMemoryRuntime, error) {
	root, err := normalizeProjectRoot(projectRoot)
	if err != nil {
		return nil, err
	}
	if err := BootstrapProjectMemory(root); err != nil {
		return nil, err
	}
	if ranker == nil {
		ranker = NewSimpleRanker()
	}
	if topK <= 0 {
		topK = 6
	}
	if recentDays <= 0 {
		recentDays = 3
	}
	return &ProjectMemoryRuntime{
		Store:      NewMemoryStoreWithWorkspace(root, shortLimit),
		Ranker:     ranker,
		TopK:       topK,
		RecentDays: recentDays,
	}, nil
}

// BuildSystemPromptBlock returns memory context text for your system prompt.
func (pm *ProjectMemoryRuntime) BuildSystemPromptBlock(query string) (string, error) {
	if pm == nil || pm.Store == nil {
		return "", fmt.Errorf("project memory runtime is nil")
	}
	longAndToday, err := pm.Store.GetMemoryContext()
	if err != nil {
		return "", err
	}
	recentDays, err := pm.Store.GetRecentMemories(pm.RecentDays)
	if err != nil {
		return "", err
	}

	all := pm.Store.Recent(200)
	selected := all
	if pm.Ranker != nil {
		selected = pm.Ranker.Rank(query, all, pm.TopK)
	}

	var sb strings.Builder
	sb.WriteString("## Memory Context\n")
	if strings.TrimSpace(longAndToday) != "" {
		sb.WriteString("### Long-Term + Today\n")
		sb.WriteString(longAndToday + "\n\n")
	}
	if strings.TrimSpace(recentDays) != "" {
		sb.WriteString("### Recent Daily Logs\n")
		sb.WriteString(recentDays + "\n\n")
	}
	if len(selected) > 0 {
		sb.WriteString("### Ranked Memory Snippets\n")
		for _, m := range selected {
			sb.WriteString("- [" + m.Kind + "] " + m.Text + "\n")
		}
	}
	return strings.TrimSpace(sb.String()), nil
}

// CaptureTurn writes one user/assistant turn into short-term memory and today's log.
func (pm *ProjectMemoryRuntime) CaptureTurn(userMessage, assistantMessage string) error {
	if pm == nil || pm.Store == nil {
		return fmt.Errorf("project memory runtime is nil")
	}
	userMessage = strings.TrimSpace(userMessage)
	assistantMessage = strings.TrimSpace(assistantMessage)
	if len(userMessage) > maxTurnMessageBytes {
		userMessage = userMessage[:maxTurnMessageBytes]
	}
	if len(assistantMessage) > maxTurnMessageBytes {
		assistantMessage = assistantMessage[:maxTurnMessageBytes]
	}

	if userMessage != "" {
		pm.Store.AddShort("user: " + userMessage)
		if err := pm.Store.AppendToday("user: " + userMessage); err != nil {
			return err
		}
	}
	if assistantMessage != "" {
		pm.Store.AddShort("assistant: " + assistantMessage)
		if err := pm.Store.AppendToday("assistant: " + assistantMessage); err != nil {
			return err
		}
	}
	return nil
}

// RememberProjectFact persists a durable fact into long-term memory.
func (pm *ProjectMemoryRuntime) RememberProjectFact(fact string) error {
	if pm == nil || pm.Store == nil {
		return fmt.Errorf("project memory runtime is nil")
	}
	fact = strings.TrimSpace(fact)
	if fact == "" {
		return nil
	}
	prev, err := pm.Store.ReadLongTerm()
	if err != nil {
		return err
	}
	entry := fmt.Sprintf("- [%s] %s", time.Now().UTC().Format(time.RFC3339), fact)
	if strings.TrimSpace(prev) == "" {
		return pm.Store.WriteLongTerm(entry)
	}
	return pm.Store.WriteLongTerm(strings.TrimRight(prev, "\n") + "\n" + entry)
}
