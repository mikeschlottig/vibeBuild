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

  app.delete("/api/projects/:id", (req, res) => {
    const projectId = req.params.id;
    db.prepare("DELETE FROM messages WHERE project_id = ?").run(projectId);
    db.prepare("DELETE FROM files WHERE project_id = ?").run(projectId);
    db.prepare("DELETE FROM projects WHERE id = ?").run(projectId);
    res.json({ success: true });
  });

  app.get("/api/projects/:id/files", (req, res) => {
    const files = db.prepare("SELECT * FROM files WHERE project_id = ?").all(req.params.id);
    res.json(files);
  });

  app.put("/api/projects/:id/files", (req, res) => {
    const { path, content } = req.body;
    const projectId = req.params.id;
    db.prepare("INSERT OR REPLACE INTO files (id, project_id, path, content) VALUES ((SELECT id FROM files WHERE project_id = ? AND path = ?), ?, ?, ?)").run(projectId, path, projectId, path, content);
    res.json({ success: true });
  });

  app.get("/api/projects/:id/messages", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages WHERE project_id = ? ORDER BY created_at ASC").all(req.params.id);
    res.json(messages);
  });

  app.post("/api/chat", async (req, res) => {
    const { projectId, message, model } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    // Save user message
    const userMsgId = Math.random().toString(36).substring(7);
    db.prepare("INSERT INTO messages (id, project_id, role, content) VALUES (?, ?, ?, ?)").run(userMsgId, projectId, 'user', message);

    try {
      const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as any;
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      let aiContent = "";
      let response;

      const getProviderConfig = (modelName: string) => {
        if (modelName.startsWith("mistralai/")) {
          return {
            url: "https://api.mistral.ai/v1/chat/completions",
            key: process.env.MISTRAL_API_KEY,
            model: modelName.replace("mistralai/", "")
          };
        } else if (modelName.startsWith("groq/")) {
          return {
            url: "https://api.groq.com/openai/v1/chat/completions",
            key: process.env.GROQ_API_KEY,
            model: modelName.replace("groq/", "")
          };
        } else {
          return {
            url: "https://openrouter.ai/api/v1/chat/completions",
            key: process.env.OPENROUTER_API_KEY,
            model: modelName
          };
        }
      };

      const config = getProviderConfig(model || "mistralai/mistral-large-latest");

      if (!config.key) {
        throw new Error(`API key for ${config.url} is not configured`);
      }

      if (!project.blueprint) {
        // Generate Blueprint
        response = await axios.post(config.url, {
          model: config.model,
          messages: [
            { role: "system", content: "You are a VibeSDK Architect. Generate a JSON blueprint for the requested app. Include 'title', 'description', 'techStack', and 'phases' (array of objects with 'name' and 'files' to be created)." },
            { role: "user", content: message }
          ],
          response_format: { type: "json_object" }
        }, {
          headers: { "Authorization": `Bearer ${config.key}` }
        });
        
        const blueprint = response.data.choices[0].message.content;
        db.prepare("UPDATE projects SET blueprint = ? WHERE id = ?").run(blueprint, projectId);
        aiContent = `Blueprint generated for **${project.name}**. Starting implementation phases...\n\n${blueprint}`;
      } else {
        // Implementation Phase
        response = await axios.post(config.url, {
          model: config.model,
          messages: [
            { role: "system", content: "You are a VibeSDK Developer. Based on the blueprint, generate the code for the next phase. Return a JSON array of objects with 'path' and 'content'." },
            { role: "user", content: `Blueprint: ${project.blueprint}\n\nUser Request: ${message}` }
          ],
          response_format: { type: "json_object" }
        }, {
          headers: { "Authorization": `Bearer ${config.key}` }
        });

        const content = response.data.choices[0].message.content;
        let filesData;
        try {
          filesData = JSON.parse(content);
        } catch (e) {
          // Handle cases where AI might return raw JSON or markdown wrapped JSON
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          filesData = jsonMatch ? JSON.parse(jsonMatch[0]) : { files: [] };
        }

        if (filesData.files && Array.isArray(filesData.files)) {
          for (const file of filesData.files) {
            const fileId = Math.random().toString(36).substring(7);
            db.prepare("INSERT OR REPLACE INTO files (id, project_id, path, content) VALUES (?, ?, ?, ?)").run(fileId, projectId, file.path, file.content);
          }
          aiContent = `Phase implemented. Generated ${filesData.files.length} files.`;
        } else {
          aiContent = content; // Fallback if no files array
        }
      }

      const aiMsgId = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO messages (id, project_id, role, content) VALUES (?, ?, ?, ?)").run(aiMsgId, projectId, 'assistant', aiContent);

      res.json({ content: aiContent });
    } catch (error: any) {
      console.error("AI Error:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.error?.message || error.message || "Failed to get AI response";
      res.status(500).json({ error: errorMsg });
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
