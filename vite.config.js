import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

// Plugin to copy FFmpeg files to dist during build and serve during dev
function ffmpegPlugin() {
  const sourceDir = path.join(__dirname, "node_modules", "@ffmpeg", "core", "dist", "umd");
  
  return {
    name: "ffmpeg-plugin",
    
    // Serve FFmpeg files during development
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith("/ffmpeg/")) {
          const fileName = req.url.replace("/ffmpeg/", "");
          const filePath = path.join(sourceDir, fileName);
          
          if (fs.existsSync(filePath)) {
            const ext = path.extname(fileName);
            const mimeTypes = {
              ".js": "text/javascript",
              ".wasm": "application/wasm",
            };
            
            res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        next();
      });
    },
    
    // Copy FFmpeg files to dist during build
    writeBundle() {
      const targetDir = path.join(__dirname, "dist", "ffmpeg");

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"];
      files.forEach((file) => {
        const source = path.join(sourceDir, file);
        const target = path.join(targetDir, file);
        if (fs.existsSync(source)) {
          fs.copyFileSync(source, target);
          console.log(`✓ Copied ${file} to dist/ffmpeg/`);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ffmpegPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
});
