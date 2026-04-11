package memory

import "testing"

func TestSimpleRankerRanksByKeyword(t *testing.T) {
	r := NewSimpleRanker()
	mems := []MemoryItem{
		{Kind: "short", Text: "buy milk and eggs"},
		{Kind: "long", Text: "call mom tomorrow"},
		{Kind: "short", Text: "milkshake recipe"},
	}
	res := r.Rank("milk", mems, 2)
	if len(res) != 2 {
		t.Fatalf("expected 2 results, got %d", len(res))
	}
	if res[0].Text != "buy milk and eggs" {
		t.Fatalf("expected top result to be 'buy milk and eggs', got %q", res[0].Text)
	}
}
