import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GROQ_API_KEY = process.env.GROQ_API_KEY || "gsk_your_free_api_key_here";

app.use(cors());
app.use(express.json());

// --- FALLBACK DESCRIPTION GENERATOR ---
function generateFallbackDescription(name, link, section, typeHint) {
    const templates = {
        'PDF document': `📄 PDF: ${name} - Important reference material${section ? ` for ${section}` : ''}.`,
        'Word document': `📝 Document: ${name} - Contains notes and information${section ? ` related to ${section}` : ''}.`,
        'spreadsheet': `📊 Spreadsheet: ${name} - Data and calculations${section ? ` for ${section}` : ''}.`,
        'presentation': `🎯 Presentation: ${name} - Slide deck${section ? ` covering ${section} topics` : ''}.`,
        'YouTube video': `🎥 Video: ${name} - Educational content${section ? ` for ${section}` : ''}.`,
        'Google Drive resource': `☁️ Google Drive: ${name} - Shared resource${section ? ` in ${section}` : ''}.`,
        'Google Doc': `📰 Google Doc: ${name} - Collaborative document${section ? ` for ${section}` : ''}.`,
        'Google Sheet': `📋 Google Sheet: ${name} - Collaborative spreadsheet${section ? ` for ${section}` : ''}.`,
        'image': `🖼️ Image: ${name} - Visual resource${section ? ` for ${section}` : ''}.`,
        'file': `📁 File: ${name} - Resource material${section ? ` for ${section}` : ''}.`
    };
    
    return templates[typeHint] || templates['file'];
}

app.post('/api/generate-description', async (req, res) => {
    const { name, link, section } = req.body;

    if (!name || !link) {
        return res.status(400).json({ error: 'Name and link are required' });
    }

    try {
        // Determine file type
        const ext = name.split('.').pop()?.toLowerCase() || '';
        let typeHint = 'file';
        if (['pdf'].includes(ext)) typeHint = 'PDF document';
        else if (['doc', 'docx'].includes(ext)) typeHint = 'Word document';
        else if (['xls', 'xlsx'].includes(ext)) typeHint = 'spreadsheet';
        else if (['ppt', 'pptx'].includes(ext)) typeHint = 'presentation';
        else if (link?.includes('youtube.com') || link?.includes('youtu.be')) typeHint = 'YouTube video';
        else if (link?.includes('drive.google.com')) typeHint = 'Google Drive resource';
        else if (link?.includes('docs.google.com')) typeHint = 'Google Doc';
        else if (link?.includes('sheets.google.com')) typeHint = 'Google Sheet';
        else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) typeHint = 'image';

        let promptText = `Create a concise 1-2 sentence description for a ${typeHint} named "${name}"${section ? ` in the "${section}" folder` : ''}. Be specific and helpful.`;

        // Try to fetch and read content from the link
        let contentSnippet = '';
        try {
            if (link && link.startsWith('http') && !link.includes('youtube.com') && !link.includes('youtu.be')) {
                console.log(`📖 Fetching content from: ${link}`);
                
                let pageContent = null;
                let fetchSuccess = false;
                
                // Try direct fetch with headers first (sometimes works without proxy)
                try {
                    console.log(`   → Trying direct fetch...`);
                    const directRes = await fetch(link, {
                        timeout: 8000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    if (directRes.ok) {
                        pageContent = await directRes.text();
                        fetchSuccess = true;
                        console.log(`   ✓ Direct fetch succeeded`);
                    }
                } catch (e1) {
                    console.log(`   ⚠️ Direct fetch failed: ${e1.message}`);
                }
                
                // Try corsproxy.io if direct fetch fails
                if (!fetchSuccess) {
                    try {
                        const proxyUrl = `https://www.corsproxy.io/?${encodeURIComponent(link)}`;
                        console.log(`   → Trying corsproxy.io...`);
                        const proxyRes = await fetch(proxyUrl, {
                            timeout: 10000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Accept': 'text/html'
                            }
                        });
                        if (proxyRes.ok) {
                            pageContent = await proxyRes.text();
                            fetchSuccess = true;
                            console.log(`   ✓ corsproxy.io succeeded`);
                        }
                    } catch (e2) {
                        console.log(`   ⚠️ corsproxy.io failed: ${e2.message}`);
                    }
                }
                
                // Try allorigins as last resort
                if (!fetchSuccess) {
                    try {
                        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(link)}`;
                        console.log(`   → Trying allorigins as fallback...`);
                        const pageRes = await fetch(proxyUrl, {
                            timeout: 8000,
                            headers: { 'User-Agent': 'Mozilla/5.0' }
                        });
                        const pageData = await pageRes.json();
                        if (pageData.contents) {
                            pageContent = pageData.contents;
                            fetchSuccess = true;
                            console.log(`   ✓ allorigins succeeded`);
                        }
                    } catch (e3) {
                        console.log(`   ⚠️ allorigins failed: ${e3.message}`);
                    }
                }
                
                if (pageContent && fetchSuccess) {
                    // Extract text content
                    let rawContent = pageContent
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
                        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
                        .replace(/<[^>]*>?/gm, '') // Remove HTML tags
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&quot;/g, '"')
                        .replace(/&amp;/g, '&')
                        .replace(/\n\n+/g, '\n') // Remove excessive newlines
                        .replace(/\s+/g, ' ') // Normalize whitespace
                        .trim();
                    
                    contentSnippet = rawContent.substring(0, 600); // Get first 600 chars
                    
                    if (contentSnippet.length > 80) {
                        promptText = `You are reading content from a webpage. Based on this excerpt, write a 1-2 sentence description for "${name}"${section ? ` in the "${section}" folder` : ''}. The item is a "${typeHint}".

Content preview:
"${contentSnippet}"

Provide a helpful, concise description (max 100 words).`;
                        console.log(`✅ Content extracted (${contentSnippet.length} chars) - using for AI prompt`);
                    } else {
                        console.log(`⚠️ Content too short (${contentSnippet.length} chars), using basic prompt`);
                    }
                } else {
                    console.log(`⚠️ Could not fetch from any proxy, using file info only`);
                }
            }
        } catch (e) {
            console.log(`⚠️ Exception in content fetching: ${e.message}`);
        }

        // Try Groq API (Free and Fast!)
        try {
            const GROQ_URL = `https://api.groq.com/openai/v1/chat/completions`;
            console.log(`🤖 Calling Groq API...`);
            
            const response = await fetch(GROQ_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [{ role: 'user', content: promptText }],
                    max_tokens: 150,
                    temperature: 0.7
                }),
                timeout: 15000
            });

            if (response.ok) {
                const data = await response.json();
                let description = data.choices?.[0]?.message?.content;

                if (description) {
                    description = description.trim();
                    if (description.length > 300) {
                        description = description.substring(0, 300) + '...';
                    }
                    console.log(`✅ Groq generated: ${description.substring(0, 50)}...`);
                    return res.json({ description });
                } else {
                    console.log(`⚠️ Groq returned no content. Full response:`, JSON.stringify(data).substring(0, 200));
                }
            } else {
                const errorText = await response.text();
                console.log(`❌ Groq API error (${response.status}): ${errorText.substring(0, 200)}`);
            }
        } catch (e) {
            console.log(`❌ Groq API exception: ${e.message}`);
        }

        // Fallback: return smart default description
        const fallbackDesc = generateFallbackDescription(name, link, section, typeHint);
        console.log(`⚠️ Using fallback description: ${fallbackDesc}`);
        res.json({ description: fallbackDesc });

    } catch (error) {
        console.error("Error in /api/generate-description:", error);
        
        // Even on error, return a fallback
        const ext = name.split('.').pop()?.toLowerCase() || '';
        let typeHint = 'file';
        if (['pdf'].includes(ext)) typeHint = 'PDF document';
        else if (['doc', 'docx'].includes(ext)) typeHint = 'Word document';
        else if (['xls', 'xlsx'].includes(ext)) typeHint = 'spreadsheet';
        else if (['ppt', 'pptx'].includes(ext)) typeHint = 'presentation';
        else if (link?.includes('youtube.com') || link?.includes('youtu.be')) typeHint = 'YouTube video';
        else if (link?.includes('drive.google.com')) typeHint = 'Google Drive resource';
        else if (link?.includes('docs.google.com')) typeHint = 'Google Doc';
        else if (link?.includes('sheets.google.com')) typeHint = 'Google Sheet';
        else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) typeHint = 'image';
        
        const fallbackDesc = generateFallbackDescription(name, link, section, typeHint);
        res.json({ description: fallbackDesc });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/generate-description`);
    console.log(`✨ Using Groq AI (Free) with intelligent fallbacks`);
});
