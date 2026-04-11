// Vercel Serverless Function — NVIDIA NIM Proxy
// Proxies chatbot requests server-side to bypass browser CORS restrictions.
// Deploy to Vercel and set NVIDIA_API_KEY_70B in Vercel Environment Variables.

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.NVIDIA_API_KEY_70B;
    if (!apiKey) {
        return res.status(500).json({ error: 'NVIDIA API key not configured on server. Add NVIDIA_API_KEY_70B to Vercel Environment Variables.' });
    }

    try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data?.message || 'NVIDIA API error', details: data });
        }

        return res.status(200).json(data);
    } catch (err) {
        console.error('[api/chat] Proxy error:', err.message);
        return res.status(500).json({ error: 'Proxy fetch failed', message: err.message });
    }
}
