# MCP FAMAPP Server

MCP (Model Context Protocol) server for FAMAPP - Manage todos, events, and extract family data directly from Claude Desktop.

## 🚀 Features

- **Todo Management**: Create, read, update, delete todos
- **Event Management**: Create, read, update, delete calendar events
- **Data Extraction**: Get family summaries and weekly agendas
- **Firebase Integration**: Real-time sync with your FAMAPP database

## 📋 Prerequisites

- Node.js 18+ installed
- Firebase project configured (FAMAPP)
- Claude Desktop app

## 🛠️ Installation

1. Navigate to the MCP directory:
```bash
cd /Users/gonzaloriederer/FAMAPP/mcp-famapp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Configure Firebase credentials:
   - Copy `.env.example` to `.env`
   - Add your Firebase configuration (already done if using existing FAMAPP)

## ⚙️ Configure Claude Desktop

1. Open Claude Desktop settings
2. Navigate to Developer -> Edit Config
3. Add this configuration:

```json
{
  "mcpServers": {
    "famapp": {
      "command": "node",
      "args": ["/Users/gonzaloriederer/FAMAPP/mcp-famapp/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

4. Restart Claude Desktop

## 🎯 Available Tools

### Todo Management

- **todo_list**: List all todos with optional filters
  - `status`: "all", "pending", "completed"
  - `assignee`: Filter by family member

- **todo_create**: Create a new todo
  - `title`: Todo title (required)
  - `description`: Additional details
  - `assignedTo`: Family member
  - `dueDate`: Due date (YYYY-MM-DD)
  - `priority`: "low", "medium", "high"

- **todo_update**: Update an existing todo
  - `id`: Todo ID (required)
  - All other fields optional

- **todo_delete**: Delete a todo
  - `id`: Todo ID (required)

### Event Management

- **event_list**: List events
  - `upcoming`: Show only future events
  - `days`: Number of days to look ahead
  - `assignee`: Filter by family member

- **event_create**: Create a new event
  - `title`: Event title (required)
  - `startDate`: ISO date string (required)
  - `endDate`: ISO date string (required)
  - `allDay`: Boolean
  - `location`: Event location
  - `assignedTo`: Family member
  - `category`: Event category
  - `color`: Hex color code

- **event_update**: Update an event
  - `id`: Event ID (required)
  - All other fields optional

- **event_delete**: Delete an event
  - `id`: Event ID (required)

### Data Extraction

- **family_summary**: Get comprehensive family data summary
  - No parameters required

- **weekly_agenda**: Get upcoming agenda
  - `days`: Number of days to look ahead (default: 7)

## 💬 Example Usage in Claude

Once configured, you can use commands like:

- "Show me all pending todos"
- "Create a todo for Gonzalo to buy milk tomorrow"
- "What events do we have next week?"
- "Add a school meeting for Borja on Tuesday at 3pm"
- "Give me a family summary"
- "Show the agenda for the next 14 days"

## 🧪 Testing

Test the server manually:
```bash
node dist/index.js
```

Then type a tool request in JSON format:
```json
{"method": "tools/call", "params": {"name": "todo_list", "arguments": {"status": "pending"}}}
```

## 🐛 Troubleshooting

1. **Firebase connection errors**: Check your `.env` file has correct credentials
2. **Permission errors**: Ensure your Firebase rules allow read/write access
3. **Claude not finding the server**: Verify the path in Claude Desktop config is absolute
4. **Server crashes**: Check logs in Claude Desktop developer console

## 📁 Project Structure

```
mcp-famapp/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── firebase-config.ts    # Firebase setup
│   ├── types.ts              # TypeScript types
│   └── services/
│       ├── todo-service.ts   # Todo operations
│       ├── event-service.ts  # Event operations
│       └── data-extraction-service.ts  # Data analysis
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
├── .env                      # Firebase credentials
└── README.md
```

## 🔒 Security

- Never commit `.env` file to git
- Firebase credentials are only stored locally
- All operations require authentication
- Data is synced with your private Firebase project

## 📝 License

MIT License - Part of FAMAPP project