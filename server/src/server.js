import app from "./app.js";
import { env } from "./config/env.js";
import { registerCommands } from "./services/discordService.js";

const PORT = env.port;

console.log("=== ENV CHECK ===");
console.log("PORT:", env.port);
console.log("APPLICATION ID:", env.discordApplicationId);
console.log("BOT TOKEN LOADED:", Boolean(env.discordBotToken));
console.log("=================");

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  registerCommands()
    .then((result) => {
      console.log("Discord slash commands registered successfully.");
      console.log("Discord registration result:", result);
    })
    .catch((error) => {
      console.error("=== DISCORD REGISTRATION ERROR ===");
      console.error("name:", error.name);
      console.error("message:", error.message);
      console.error("cause:", error.cause);
      console.error("stack:", error.stack);
      console.error("==================================");
    });
});

server.on("error", (error) => {
  console.error("SERVER ERROR:", error);
});