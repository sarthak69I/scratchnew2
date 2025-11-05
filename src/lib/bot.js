import { Bot } from "grammy";

const bot = new Bot(process.env.BOT_TOKEN);
const botx = new Bot(process.env.PVT_BOT_TOKEN);

export { bot, botx };
