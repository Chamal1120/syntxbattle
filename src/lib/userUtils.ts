export function getBotAvatar(userId: string) {
    // We use the 'bottts' style from DiceBear
    // The seed ensures the same user always gets the same robot
    return `https://api.dicebear.com/9.x/bottts/svg?seed=${userId}`;
}
