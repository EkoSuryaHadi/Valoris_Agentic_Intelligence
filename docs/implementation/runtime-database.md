# Runtime Database Boundary

The database package validates `DATABASE_URL` and exposes a driver-agnostic transaction wrapper. Production adapters must use parameterized queries, organization/project scoping, and `withTransaction` for multi-write operations. The wrapper deliberately does not instantiate a driver, keeping deployment choice (`pg`, managed pool, or serverless adapter) outside domain logic.
