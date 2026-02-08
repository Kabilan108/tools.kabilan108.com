# Claude Guidelines for tools.kabilan108.com

## Build & Run Commands
- `bun start` - Start the server
- `bun dev` - Start development server with hot reload
- `bun biome check .` - Run linter
- `bun biome format .` - Format code
- `bun main.js` - Run the server directly
- `bun ./src/scripts/create-secret.js` - Generate new API key/secret

## Code Style Guidelines
- **Formatting**: Use Biome (88 char line width, 2 space indent)
- **Imports**: Use ES modules, organize imports automatically
- **Quotes**: Use single quotes for strings
- **Variables**: camelCase for variables and functions
- **Error Handling**: Use logger.error for errors
- **Environment**: Use env.js utility for environment variables
- **Naming**: Descriptive names, avoid abbreviations
- **Middleware**: Separate authentication logic in middleware
- **Routes**: Organize routes by domain/feature
- **DB**: Use bun:sqlite for database operations
- **Logging**: Use logger utility with appropriate levels

Run Biome before committing changes.