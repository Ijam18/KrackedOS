package memory

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// MemoryItem is a stored memory entry.
type MemoryItem struct {
	Kind      string
	Text      string
	Timestamp time.Time
}

// MemoryStore keeps short-term and long-term memory.
type MemoryStore struct {
	workspace string
	memoryDir string
	limit     int
	initErr   error
	long      []MemoryItem
	short     []MemoryItem
	mu        sync.RWMutex
}

func NewMemoryStore(limit int) *MemoryStore {
	return NewMemoryStoreWithWorkspace(".", limit)
}

func NewMemoryStoreWithWorkspace(workspace string, limit int) *MemoryStore {
	if limit <= 0 {
		limit = 100
	}
	workspace = strings.TrimSpace(workspace)
	if workspace == "" {
		workspace = "."
	}
	workspace = filepath.Clean(workspace)
	if abs, err := filepath.Abs(workspace); err == nil {
		workspace = abs
	}
	ms := &MemoryStore{
		workspace: workspace,
		memoryDir: filepath.Join(workspace, "memory"),
		short:     make([]MemoryItem, 0, limit),
		long:      make([]MemoryItem, 0),
		limit:     limit,
	}
	if err := os.MkdirAll(ms.memoryDir, 0o755); err != nil {
		ms.initErr = err
	}
	return ms
}

func (s *MemoryStore) ready() error {
	if s == nil {
		return fmt.Errorf("memory store is nil")
	}
	if s.initErr != nil {
		return s.initErr
	}
	return nil
}

func (s *MemoryStore) AddShort(text string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	it := MemoryItem{Timestamp: time.Now().UTC(), Text: text, Kind: "short"}
	s.short = append(s.short, it)
	if len(s.short) > s.limit {
		s.short = s.short[len(s.short)-s.limit:]
	}
}

func (s *MemoryStore) AddLong(text string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	it := MemoryItem{Timestamp: time.Now().UTC(), Text: text, Kind: "long"}
	s.long = append(s.long, it)
}

func (s *MemoryStore) Recent(n int) []MemoryItem {
	if n <= 0 {
		return nil
	}
	out := make([]MemoryItem, 0, n)
	s.mu.RLock()
	defer s.mu.RUnlock()
	for i := len(s.short) - 1; i >= 0 && len(out) < n; i-- {
		out = append(out, s.short[i])
	}
	for i := len(s.long) - 1; i >= 0 && len(out) < n; i-- {
		out = append(out, s.long[i])
	}
	return out
}

func (s *MemoryStore) QueryByKeyword(keyword string, n int) []MemoryItem {
	if n <= 0 || keyword == "" {
		return nil
	}
	k := strings.ToLower(keyword)
	out := make([]MemoryItem, 0, n)
	s.mu.RLock()
	defer s.mu.RUnlock()
	for i := len(s.short) - 1; i >= 0 && len(out) < n; i-- {
		if strings.Contains(strings.ToLower(s.short[i].Text), k) {
			out = append(out, s.short[i])
		}
	}
	for i := len(s.long) - 1; i >= 0 && len(out) < n; i-- {
		if strings.Contains(strings.ToLower(s.long[i].Text), k) {
			out = append(out, s.long[i])
		}
	}
	return out
}

func (s *MemoryStore) ReadLongTerm() (string, error) {
	if err := s.ready(); err != nil {
		return "", err
	}
	path := filepath.Join(s.memoryDir, "MEMORY.md")
	b, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", err
	}
	return string(b), nil
}

func (s *MemoryStore) WriteLongTerm(content string) error {
	if err := s.ready(); err != nil {
		return err
	}
	if err := os.MkdirAll(s.memoryDir, 0o755); err != nil {
		return err
	}
	path := filepath.Join(s.memoryDir, "MEMORY.md")
	return os.WriteFile(path, []byte(content), 0o644)
}

func (s *MemoryStore) ReadToday() (string, error) {
	if err := s.ready(); err != nil {
		return "", err
	}
	name := time.Now().UTC().Format("2006-01-02") + ".md"
	path := filepath.Join(s.memoryDir, name)
	b, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", err
	}
	return string(b), nil
}

func (s *MemoryStore) AppendToday(text string) error {
	if err := s.ready(); err != nil {
		return err
	}
	if err := os.MkdirAll(s.memoryDir, 0o755); err != nil {
		return err
	}
	name := time.Now().UTC().Format("2006-01-02") + ".md"
	path := filepath.Join(s.memoryDir, name)
	f, err := os.OpenFile(path, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = fmt.Fprintf(f, "[%s] %s\n", time.Now().UTC().Format(time.RFC3339), text)
	return err
}

func (s *MemoryStore) GetRecentMemories(days int) (string, error) {
	if err := s.ready(); err != nil {
		return "", err
	}
	if days <= 0 {
		days = 1
	}
	parts := make([]string, 0, days)
	for i := 0; i < days; i++ {
		d := time.Now().UTC().AddDate(0, 0, -i)
		name := d.Format("2006-01-02") + ".md"
		path := filepath.Join(s.memoryDir, name)
		b, err := os.ReadFile(path)
		if err != nil {
			if os.IsNotExist(err) {
				continue
			}
			return "", err
		}
		parts = append(parts, string(b))
	}
	return strings.Join(parts, "\n---\n"), nil
}

func (s *MemoryStore) GetMemoryContext() (string, error) {
	if err := s.ready(); err != nil {
		return "", err
	}
	lt, err := s.ReadLongTerm()
	if err != nil {
		return "", err
	}
	td, err := s.ReadToday()
	if err != nil {
		return "", err
	}
	if lt == "" && td == "" {
		return "", nil
	}
	if lt == "" {
		return td, nil
	}
	if td == "" {
		return lt, nil
	}
	return lt + "\n\n---\n\n" + td, nil
}
