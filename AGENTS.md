# MicroProjects Repository Guidelines

## Strict Micro-Projects Separation & Isolation

Every micro-project in this repository is completely autonomous, standalone, and strictly isolated.

### Core Rules:
1. **Never Bind or Combine Projects at Root**:
   - Do NOT create a combined `index.html`, hub, launcher, or portal at the repository root.
   - The repository root is strictly a folder container for projects.
2. **Directory Independence**:
   - Every subfolder (e.g. `RFcolor/`, `sumospik/`) is an independent application.
   - Zero cross-project dependencies, asset sharing, or relative imports across project folders.
3. **Standalone Serving / Deployment**:
   - When serving locally or deploying, always target the specific project directory directly (e.g. `python -m http.server 8080 -d sumospik`), never from the repository root.
4. **Isolated Multi-Tenant Backends**:
   - Each project has its own dedicated PocketBase prefix (`sumospik_*`, `RFALL_*`), service account (`sumospik@zece.info`, `rfall@zece.info`), and collection rules.
