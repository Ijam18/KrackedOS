import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { scrapeReferencePayload } from './tools/referenceScraper.js'

function ideaToPromptScrapePlugin() {
  return {
    name: 'idea-to-prompt-scrape-dev',
    configureServer(server) {
      server.middlewares.use('/__idea-to-prompt/scrape-reference', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const chunks = []
          for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          }

          const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
          const result = await scrapeReferencePayload({
            referenceUrl: body?.referenceUrl || body?.websiteReferenceUrl || body?.designReferenceUrl || ''
          })

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Failed to scrape reference URL.'
          }))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), ideaToPromptScrapePlugin()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    hmr: {
      host: '127.0.0.1',
      port: 5173,
      clientPort: 5173,
      protocol: 'ws'
    }
  },
  build: {
    chunkSizeWarningLimit: 1000
  }
})
