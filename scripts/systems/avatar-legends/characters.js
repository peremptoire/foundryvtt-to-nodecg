// =============================
// Character Stats Bridge
// =============================

Hooks.on("ready", () => {
    sendAllCharacterData();
});

Hooks.on("updateActor", async function (actor) {
    if (actor.type === "player") {
        const characterData = buildCharacterData(actor);
        await sendCharacterData(characterData);
    }
});

function buildCharacterData(actor) {
    return {
        actorId: actor.id,
        userId: game.user.id,
        timestamp: new Date().toISOString(),
        actorName: actor.name,
        actorData: actor.system
    };
}

async function sendAllCharacterData() {
    for (const actor of game.actors.contents) {
        if (actor.type === "player") {
            const characterData = buildCharacterData(actor);
            await sendCharacterData(characterData);
        }
    }
}

async function sendCharacterData(characterData) {
    game.socket.emit("module.foundryvtt-to-nodecg", {
        type: "characterUpdate",
        data: characterData
    });
}

setInterval(
    sendAllCharacterData,
    60000
);

sendAllCharacterData();
