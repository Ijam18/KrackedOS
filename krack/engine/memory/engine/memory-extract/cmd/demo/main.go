package main

import (
	"fmt"
	"log"

	"picobot-memory-extract/memory"
)

func main() {
	pm, err := memory.NewProjectMemoryRuntime(".", 200, 8, 7, nil)
	if err != nil {
		log.Fatal(err)
	}

	user := "Can you track project decisions and remind me later?"
	block, err := pm.BuildSystemPromptBlock(user)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("=== Memory Block For System Prompt ===")
	fmt.Println(block)

	assistant := "Yes. I will persist key facts and use them in future responses."
	if err := pm.CaptureTurn(user, assistant); err != nil {
		log.Fatal(err)
	}
	if err := pm.RememberProjectFact("Owner wants autonomous project management support."); err != nil {
		log.Fatal(err)
	}

	fmt.Println("\nSaved one turn + one long-term fact.")
}
