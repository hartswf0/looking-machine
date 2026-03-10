# Graph Operator: Publishable Product Spec (v1)

## Product Thesis
Graph Operator is a provenance-native creative pipeline: a Git-like graph for prompts, transformations, runs, and generated artifacts.

## One-Sentence Positioning
"Graph Operator is Git for generative workflows, where every prompt, operation, and output is traceable, branchable, and reusable."

## Who It Serves
- Prompt engineers and AI content teams
- Researchers building multi-step agentic chains
- Creative studios producing text/image/video artifacts

## Jobs To Be Done
- Track how an output was produced from source to artifact
- Branch, compare, and backtrack prompt chains
- Reuse proven cells as building blocks across projects
- Keep one clean interface for text/code/image/video/iframe payloads

## Core Ontology (Primitives)
- Workspace: container for lanes and cells
- Lane: a family stream (conceptual grouping, not rigid category)
- Cell: atomic unit containing payload + metadata
- Edge: explicit relationship between cells
- Run: execution record (model, params, timestamp, result links)
- Artifact: output object (html, video prompt, image, clip, code, iframe)

## Edge Types (Must Be Explicit)
- derives_from: child generated from one parent
- operates_on: transformation using one or more target cells
- references: non-generative citation link
- version_of: revision relationship

## Cell Schema (Minimum)
- id
- label
- payload_type: text | code | image | video | iframe | json
- payload
- parents: [cell_id]
- lane_id
- family
- source_path_or_url
- created_at
- created_by
- tags

## Product Invariants
- Every non-root cell has at least one parent edge
- Every artifact is linked to at least one run or source cell
- No hidden transformations: if it changes payload, it creates a new cell
- Provenance is never overwritten, only appended

## Information Architecture
1. Left Rail (Navigator)
- workspaces
- search
- saved views

2. Center Vessel (Infinite Lane Graph)
- horizontally growing lanes
- collapsible lane columns
- holding cells for empty branches
- explicit parent/child visibility

3. Right Inspector
- focused cell metadata
- payload preview
- lineage + run history
- single copy/export action

4. Command Palette (Primary Interaction)
- create cell
- derive child
- operate on selected cells
- move lane
- tag, branch, merge, compare

## MVP (Publishable v1)
- Persistent graph storage (graph-library.json + local autosave)
- Create/select/derive/operate cell flow
- Multi-parent operation cells
- Payload previews for text/code/iframe/image
- Search/filter by id/tag/family/path
- Import/export workspace JSON
- Read-only provenance timeline per cell

## What To Remove From Prototype
- Hardcoded category thinking as primary model
- Dense top navigation and excessive global buttons
- Hidden generation logic without explicit run records

## What Makes It "Real"
- Deterministic provenance model
- Durable storage + export format
- Clear primitives that support any modality
- Workflow that scales from 10 cells to 10,000+ cells

## Technical Architecture (Initial)
- Frontend: single-file HTML/CSS/JS (current), then modular split
- Data layer: in-memory graph + JSON serialization
- Persistence: localStorage cache + file import/export
- Optional phase 2: sqlite/db backend + multi-user sync

## Success Criteria (v1)
- User can reconstruct any artifact lineage in under 10 seconds
- User can branch and create operation child in under 3 actions
- User can export/import full graph without broken references
- Interface remains usable with 1,000+ cells (virtualized lanes)

## Release Narrative
"A provenance vessel for generative work. Build with cells, not documents. Branch ideas, compose operations, and publish artifacts with traceable lineage."

## Roadmap
### Phase 1: Foundation
- finalize graph schema
- persistence + import/export
- command palette + keyboard model

### Phase 2: Production
- run records
- artifact registry
- compare/merge views

### Phase 3: Team
- multi-user workspaces
- review/approval states
- publish bundles (lineage + outputs)
