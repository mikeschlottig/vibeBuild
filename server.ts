import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("vibebuilder.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    blueprint TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    path TEXT NOT NULL,
    content TEXT,
    purpose TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/projects", (req, res) => {
    const projects = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
    res.json(projects);
  });

  app.post("/api/projects", (req, res) => {
    const { name, description } = req.body;
    const id = Math.random().toString(36).substring(7);
    db.prepare("INSERT INTO projects (id, name, description) VALUES (?, ?, ?)").run(id, name, description);
    res.json({ id, name, description });
  });

  app.get("/api/projects/:id/files", (req, res) => {
    const files = db.prepare("SELECT * FROM files WHERE project_id = ?").all(req.params.id);
    res.json(files);
  });

  app.get("/api/projects/:id/messages", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages WHERE project_id = ? ORDER BY created_at ASC").all(req.params.id);
    res.json(messages);
  });

  app.post("/api/chat", async (req, res) => {
    const { projectId, message, model } = req.body;
    
    // Save user message
    const userMsgId = Math.random().toString(36).substring(7);
    db.prepare("INSERT INTO messages (id, project_id, role, content) VALUES (?, ?, ?, ?)").run(userMsgId, projectId, 'user', message);

    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      
      // Step 1: Check if project has a blueprint. If not, generate one.
      const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as any;
      
      let aiContent = "";
      
      if (!project.blueprint) {
        // Generate Blueprint
        const blueprintResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
          model: model || "mistralai/mistral-large",
          messages: [
            { role: "system", content: "You are a VibeSDK Architect. Generate a JSON blueprint for the requested app. Include 'title', 'description', 'techStack', and 'phases' (array of objects with 'name' and 'files' to be created)." },
            { role: "user", content: message }
          ],
          response_format: { type: "json_object" }
        }, {
          headers: { "Authorization": `Bearer ${apiKey}` }
        });
        
        const blueprint = blueprintResponse.data.choices[0].message.content;
        db.prepare("UPDATE projects SET blueprint = ? WHERE id = ?").run(blueprint, projectId);
        aiContent = `Blueprint generated for **${project.name}**. Starting implementation phases...\n\n${blueprint}`;
      } else {
        // Implementation Phase
        const implementationResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
          model: model || "mistralai/codestral-22b",
          messages: [
            { role: "system", content: "You are a VibeSDK Developer. Based on the blueprint, generate the code for the next phase. Return a JSON array of objects with 'path' and 'content'." },
            { role: "user", content: `Blueprint: ${project.blueprint}\n\nUser Request: ${message}` }
          ],
          response_format: { type: "json_object" }
        }, {
          headers: { "Authorization": `Bearer ${apiKey}` }
        });

        const filesData = JSON.parse(implementationResponse.data.choices[0].message.content);
        if (filesData.files) {
          for (const file of filesData.files) {
            const fileId = Math.random().toString(36).substring(7);
            db.prepare("INSERT OR REPLACE INTO files (id, project_id, path, content) VALUES (?, ?, ?, ?)").run(fileId, projectId, file.path, file.content);
          }
        }
        aiContent = `Phase implemented. Generated ${filesData.files?.length || 0} files.`;
      }

      const aiMsgId = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO messages (id, project_id, role, content) VALUES (?, ?, ?, ?)").run(aiMsgId, projectId, 'assistant', aiContent);

      res.json({ content: aiContent });
    } catch (error: any) {
      console.error("AI Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
