# RakshaPath Engineering & Architecture Rules

## Core Principles
1. **Scope Levels**: Build strictly in the order of the PRD scope levels (Level 1 Core -> Level 2 Reliable -> Level 3 Intelligent -> Level 4 Stretch).
2. **Step-by-Step Delivery**: Always provide a clear, concise plan before coding any step and wait for approval.
3. **Spatial Integrity**: Use PostGIS for all spatial operations (buffers, point-in-polygon, ST_DWithin, ST_Distance). Never compute ad-hoc Euclidean distances for geo-coordinates.
4. **Secret Hygiene**: Never hardcode credentials, keys, or tokens. Use environment variables and keep `.env.example` in sync.
5. **Deterministic Testing**: Write unit/integration tests for endpoints and ingestion connectors using recorded mock responses. Never rely on live external APIs during automated tests.
6. **Domain Honesty**:
   - The app must **never** report an SOS as "sent" unless delivery is confirmed by the backend or network ACK.
   - Weather hazards and ML model outputs must **always** be worded as risks/estimates, never as guaranteed facts.
7. **Transparent Communication**: After each step, provide exact run instructions, test verification commands, and clearly state anything that remains untested.
8. **Dependency & Schema Control**: Solicit confirmation before introducing any major external dependency or altering the core data schema.
