// =============================
// Character Stats Bridge
// =============================

Hooks.on("ready", () => {
    sendAllCharacterData();
});

Hooks.on("updateActor", async function (actor) {
    if (actor.type === "character") {
        const characterData = buildCharacterData(actor);
        await sendCharacterData(characterData);
    }
});

function buildCharacterData(actor) {
    return {
        actor: actor,
        actorId: actor.id,
        userId: game.user.id,
        timestamp: new Date().toISOString(),
        actorName: actor.name,
        details: actor.system.details,
        attributes: actor.system.attributes,
        abilities: {
            strength: actor.system.abilities.str || 0,
            dexterity: actor.system.abilities.dex || 0,
            constitution: actor.system.abilities.con || 0,
            intelligence: actor.system.abilities.int || 0,
            wisdom: actor.system.abilities.wis || 0,
            charisma: actor.system.abilities.cha || 0,
        }
    };
}

async function sendAllCharacterData() {
    for (const actor of game.actors.contents) {
        if (actor.type === "character") {
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
    300000
);

sendAllCharacterData();
