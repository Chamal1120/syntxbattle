/**
 * Syntxbattle - Avatar URL constructor
 *
 * @author Chamal Mallawaarachchi
 */
export function getBotAvatar(userId: string) {
    // The seed ensures the same user always gets the same robot
    return `https://api.dicebear.com/9.x/bottts/svg?seed=${userId}`;
}
