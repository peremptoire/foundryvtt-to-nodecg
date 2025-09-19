// =============================
// Dice Roll Bridge
// =============================

Hooks.on("preCreateChatMessage", async function (msg) {
    const rollData = await extractUnifiedRollData(msg);
    if (rollData) {
        await sendDiceRollData(rollData);
    }
});

// -----------------------------
// Dice Roll Extraction
// -----------------------------
async function extractUnifiedRollData(msg) {

    const htmlData = parseHTMLRollData(msg.content);

    const unifiedData = {
        timestamp: msg.timestamp,
        blind: msg.blind,
        userId: msg.author?.id || game.author.id,
        userName: msg.author?.name || game.author.name,
        actorName: msg.speaker.alias,
        formula: msg.rolls?.[0]?.formula || htmlData.formula,
        details: msg.rolls?.[0]?.terms
            ? msg.rolls[0].terms.flatMap(t => t.results?.map(r => r.result) || [])
            : htmlData.details, total: msg.rolls?.[0]?.total || htmlData.total,
        titles: htmlData.titles || []
    };
    return unifiedData;
}

function parseHTMLRollData(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    return {
        titles: Array.from(doc.querySelectorAll('.title')).map(el => el.textContent.trim()),
        formula: doc.querySelector('.dice-formula')?.textContent?.trim() || '',
        total: parseInt(doc.querySelector('.dice-total')?.textContent?.trim()) ||
            parseInt(doc.querySelector('[data-roll-total]')?.getAttribute('data-roll-total')) || 0,
        details: Array.from(doc.querySelectorAll('.dice-rolls .roll')).map(die =>
            parseInt(die.textContent.trim())
        ),
    };
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
