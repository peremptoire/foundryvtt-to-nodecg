// =============================
// Dice Roll Bridge
// =============================

Hooks.on("preCreateChatMessage", async function (msg) {

    const actorName = msg.speaker.alias;
    const isCharacter = game.actors.contents.some(actor =>
        actor.type === "character" && actor.name === actorName
    );

    const rollData = await extractUnifiedRollData(msg);
    if (rollData && isCharacter) {
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
        actorId: htmlData.actorId || msg.speaker?.actor,
        actorName: msg.speaker.alias,
        formula: msg.rolls?.[0]?.formula || htmlData.formula,
        details: msg.rolls?.[0]?.terms
            ? msg.rolls[0].terms
                .flatMap(term => term.results.map(r => r.result))
            : htmlData.details, total: msg.rolls?.[0]?.total || htmlData.total,
        title: htmlData.title || "",
    };
    return unifiedData;
}

function parseHTMLRollData(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    return {
        title: doc.querySelector('.cell__title')?.textContent?.trim() || '',
        formula: doc.querySelector('.dice-formula')?.textContent?.trim() || '',
        total: parseInt(doc.querySelector('.dice-total')?.textContent?.trim()) ||
            parseInt(doc.querySelector('[data-roll-total]')?.getAttribute('data-roll-total')) || 0,
        details: Array.from(doc.querySelectorAll('.dice-rolls .roll')).map(die =>
            parseInt(die.textContent.trim())
        ),
        actorId: doc.querySelector('[data-actor-id]')?.getAttribute('data-actor-id') || ''
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
