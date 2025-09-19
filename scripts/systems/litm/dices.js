// =============================
// Dice Roll Bridge
// =============================

Hooks.on("preCreateChatMessage", async function (msg) {
    const rollData = await extractUnifiedRollData(msg);
    if (rollData) {
        await sendDiceRollData(rollData);
        console.log("Extracted unified roll data:", rollData);
    }
});

// -----------------------------
// Dice Roll Extraction
// -----------------------------
async function extractUnifiedRollData(msg) {


    const unifiedData = {
        /* msg: msg, */
        timestamp: msg.timestamp,
        blind: msg.blind,
        userId: msg.author?.id || game.author.id,
        userName: msg.author?.name || game.author.name,
        actorName: msg.speaker.alias,
        formula: msg.rolls?.[0]?.formula,
        details: msg.rolls[0].terms.flatMap(t => t.results?.map(r => r.result) || []),
        modifiers: (msg.rolls?.[0]?.options?.modifiers || []).map(m => ({
            name: m.name,
            amount: m.amount,
            subtype: m.subtype,
            strikeout: m.strikeout
        })), total: msg.rolls?.[0]?.total,
    };
    return unifiedData;
}

// -----------------------------
// Outbound socket
// -----------------------------
async function sendDiceRollData(rollData) {
    if (rollData.total !== 0) {
        game.socket.emit("module.foundryvtt-to-nodecg", {
            type: "diceRoll",
            data: rollData
        });
    }
}
