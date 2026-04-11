package memory

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMemoryPersistence_ReadWriteLongAndToday(t *testing.T) {
	tmp := t.TempDir()
	s := NewMemoryStoreWithWorkspace(tmp, 10)

	if err := s.WriteLongTerm("Long-term fact\n"); err != nil {
		t.Fatalf("WriteLongTerm error: %v", err)
	}
	lt, err := s.ReadLongTerm()
	if err != nil {
		t.Fatalf("ReadLongTerm error: %v", err)
	}
	if lt != "Long-term fact\n" {
		t.Fatalf("unexpected long-term content: %q", lt)
	}

	if err := s.AppendToday("note 1"); err != nil {
		t.Fatalf("AppendToday error: %v", err)
	}
	files, _ := os.ReadDir(filepath.Join(tmp, "memory"))
	if len(files) == 0 {
		t.Fatalf("expected memory file created")
	}

	mc, err := s.GetMemoryContext()
	if err != nil {
		t.Fatalf("GetMemoryContext error: %v", err)
	}
	if mc == "" {
		t.Fatalf("expected memory context, got empty")
	}
}
