const tasks = {
  G9: "MCP server",
  G10: "Concurrent-player load test",
};

const task = process.argv[2];
console.error(`${tasks[task] ?? "Requested command"} is not implemented yet. See task ${task} in docs/goodness/README.md.`);
process.exitCode = 1;
