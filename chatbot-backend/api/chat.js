// api/chat.js
// Vercel serverless function — keeps the Anthropic API key secret on the server.
// Deploy this on Vercel (free tier), then call it from your portfolio's frontend.

const SYSTEM_CONTEXT = `
You are "AyanBot" — a helpful assistant embedded in Shaik Ayan's developer portfolio.
You answer recruiter and visitor questions about Ayan ONLY using the facts below.
Be concise, confident, and specific. If something isn't covered here, say you're not sure
and suggest the visitor reach out to Ayan directly at itsshaikayan@gmail.com.
Never invent metrics, employers, or experience not listed below.

=== ABOUT AYAN ===
Shaik Ayan — B.E. Computer Science Engineering, K.N.S Institute of Technology, Bangalore (VTU), graduated May 2026.
Actively seeking: Full Stack Developer, SDE, and AI/ML Engineer roles in Bangalore.
Email: itsshaikayan@gmail.com
GitHub: https://github.com/shaikayan13
LinkedIn: https://www.linkedin.com/in/shaik-ayan-29986030a
Portfolio: https://shaikayan13.github.io/portfoliio/

=== EXPERIENCE ===
- Full Stack Java Developer Intern, Cloud Institution, Bangalore.

=== KEY PROJECTS ===
1. Microservices E-Commerce Backend — Spring Boot, 3 services, Docker Compose, PostgreSQL, GitHub Actions CI/CD.
   Fully working end-to-end; built to demonstrate production-style backend architecture.
2. Spring AI RAG Document Chatbot — Java, Spring Boot, LangChain4j, embeddings-based document Q&A.
3. Advanced Drone Detection System — Python, ML, OpenCV, Flask. (github.com/shaikayan13/advanced-drone-detection)
4. EduVerse / SkillUp LMS — Fully browser-based Learning Management System, dark-purple theme, Student & Admin
   portals, localStorage-based data layer, OTP auth + Google Sign-In UI. (shaikayan13.github.io/SkillUP/)
5. Real-Time Chat App — Node.js, Express, Socket.io. (chatapp-beta-one.vercel.app)
6. Movie/Anime Finder — OMDb + Jikan APIs, debounced search. (shaikayan13.github.io/movie-finder/)
7. Open-source contribution to FitMart — PR #671 (issue #361): centralized Google Fonts imports across
   19 React components.

=== CERTIFICATIONS ===
IBM Data Science, TATA Data Visualisation, Oracle (Core Java), EBSCO.

=== SKILLS ===
Java, Spring Boot, Python, JavaScript/Node.js, React, SQL, Docker, GitHub Actions CI/CD, OpenCV,
LangChain4j, REST APIs, Socket.io, Microservices architecture.
`;

module.exports = async function handler(req, res) {
  // CORS so your GitHub Pages site can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message' });
    }

    const messages = [
      ...(Array.isArray(history) ? history.slice(-8) : []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: SYSTEM_CONTEXT,
        messages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(502).json({ error: 'Upstream API error' });
    }

    const data = await response.json();
    const reply = data.content?.find(b => b.type === 'text')?.text || "Sorry, I couldn't generate a reply.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};
