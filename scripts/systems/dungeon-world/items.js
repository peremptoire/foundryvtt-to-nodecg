// =============================
// Item Stats Bridge
// =============================

Hooks.on("init", function () {
    console.log("Item Stats Bridge module initialized");
});

Hooks.on("ready", function () {
    console.log("Item Stats Bridge ready");
});

Hooks.on("createItem", async function (item, options, userId) {
    if (!item.actor) return;

    const itemData = {
        type: "itemCreate",
        actorId: item.actor.id,
        actorName: item.actor.name,
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        userId: userId,
        timestamp: new Date().toISOString(),
        itemData: item.system
    };

    await sendItemData(itemData);
    if (window.sendCharacterStatsForActor) {
        await window.sendCharacterStatsForActor(item.actor);
    }
});

Hooks.on("updateItem", async function (item, updateData, options, userId) {
    if (!item.actor) return;

    const itemData = {
        type: "itemUpdate",
        actorId: item.actor.id,
        actorName: item.actor.name,
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        userId: userId,
        timestamp: new Date().toISOString(),
        changes: updateData.system,
        itemData: item.system
    };

    await sendItemData(itemData);

    if (window.sendCharacterStatsForActor) {
        await window.sendCharacterStatsForActor(item.actor);
    }
});

Hooks.on("deleteItem", async function (item, options, userId) {
    if (!item.actor) return;

    const itemData = {
        type: "itemDelete",
        actorId: item.actor.id,
        actorName: item.actor.name,
        itemData: item.system,
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        userId: userId,
        timestamp: new Date().toISOString()
    };

    await sendItemData(itemData);
    if (window.sendCharacterStatsForActor) {
        await window.sendCharacterStatsForActor(item.actor);
    }
});


// -----------------------------
// Outbound socket
// -----------------------------
async function sendItemData(itemData) {
    game.socket.emit("module.foundryvtt-to-nodecg", {
        type: "itemEvent",
        data: itemData
    });
    console.log("Item data sent to external system:", itemData);
}

