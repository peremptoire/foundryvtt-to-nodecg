// =============================
// Character Stats Bridge
// =============================

let periodicTimer;

Hooks.on("init", function () {
    console.log("Character Stats Bridge module initialized");
});

Hooks.on("ready", function () {
    console.log("Character Stats Bridge ready");

});


Hooks.on("updateActor", async function (actor, updateData, options, userId) {
    const characterData = {
        actorId: actor.id,
        actorName: actor.name,
        userId: userId,
        timestamp: new Date().toISOString(),
        changes: updateData.system,
        actorData: actor.system,
    };

    await sendCharacterData(characterData);
});


async function sendCharacterData(characterData) {
    game.socket.emit("module.foundryvtt-to-nodecg", {
        type: "characterUpdate",
        data: characterData
    });
}
