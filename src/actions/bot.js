"use server";

import { bot, botx } from "@/lib/bot";

export async function isUserChatMember(chatId, userId, isPrivate = false) {
    let response;

    try {
        if (isPrivate) {
            response = await botx.api.getChatMember(chatId, userId);
        } else {
            response = await bot.api.getChatMember(chatId, userId);
        }
    } catch (error) {
        return false;
    }

    return ["creator", "administrator", "member"].includes(response.status);
}

export async function isUserChatBooster(chatId, userId) {
    try {
        const response = await bot.api.getUserChatBoosts(chatId, userId);
        return (response.boosts.length > 0) ? true : false;
    } catch (error) {
        return false;
    }
}

export async function sendMessage(userId, text) {
    try {
        await bot.api.sendMessage(userId, text, { parse_mode: "HTML" });
        return true;
    } catch (error) {
        return false;
    }
}