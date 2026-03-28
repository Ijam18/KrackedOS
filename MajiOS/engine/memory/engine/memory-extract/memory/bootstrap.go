package memory

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func normalizeProjectRoot(projectRoot string) (string, error) {
	root := strings.TrimSpace(projectRoot)
	if root == "" {
		return "", fmt.Errorf("project root cannot be empty")
	}
	root = filepath.Clean(root)
	abs, err := filepath.Abs(root)
	if err != nil {
		return "", err
	}
	st, err := os.Stat(abs)
	if err == nil && !st.IsDir() {
		return "", fmt.Errorf("project root is not a directory: %s", abs)
	}
	if err != nil && !os.IsNotExist(err) {
		return "", err
	}
	return abs, nil
}

// BootstrapProjectMemory ensures a project has a ready-to-use memory folder and baseline files.
func BootstrapProjectMemory(projectRoot string) error {
	root, err := normalizeProjectRoot(projectRoot)
	if err != nil {
		return err
	}
	memDir := filepath.Join(root, "memory")
	if err := os.MkdirAll(memDir, 0o755); err != nil {
		return err
	}

	longPath := filepath.Join(memDir, "MEMORY.md")
	if _, err := os.Stat(longPath); os.IsNotExist(err) {
		if err := os.WriteFile(longPath, []byte("# Project Memory\n\n"), 0o644); err != nil {
			return err
		}
	}

	todayPath := filepath.Join(memDir, time.Now().UTC().Format("2006-01-02")+".md")
	if _, err := os.Stat(todayPath); os.IsNotExist(err) {
		if err := os.WriteFile(todayPath, []byte("# Daily Notes\n\n"), 0o644); err != nil {
			return err
		}
	}

	return nil
}
