import styles from "@/styles/giveaway.module.css";


export function formatLocalTimestamp(timestamp) {
    const date = new Date(timestamp);

    const options = {
        month: "short",   // e.g. "Oct"
        day: "numeric",   // e.g. "15"
        hour: "2-digit",  // e.g. "14"
        minute: "2-digit",
        hour12: false,    // 24-hour format
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // user’s local zone
    };

    return date.toLocaleString("en-US", options).replace(",", " at");
}


export function addSystemChannel(chats) {
    const SYSTEM_CHANNEL_ID = process.env.NEXT_PUBLIC_SYSTEM_CHANNEL_ID;
    const SYSTEM_CHANNEL_LINK = process.env.NEXT_PUBLIC_SYSTEM_CHANNEL_LINK;

    const updatedChats = [...chats];

    if (!updatedChats.some(chat => chat.id == SYSTEM_CHANNEL_ID)) {
        updatedChats.push({
            id: SYSTEM_CHANNEL_ID,
            title: "System Channel",
            link: SYSTEM_CHANNEL_LINK,
            photo: "/channel.svg",
            isSystem: true,
        });
    }

    return updatedChats;
}


export function getStatus(startTime, endTime) {
    const now = Math.floor(Date.now() / 1000);

    if (now < startTime) return { status: "Upcoming", color: styles.gray };
    if (now <= endTime) return { status: "Ongoing", color: styles.green };
    return { status: "Ended", color: styles.red };
}
