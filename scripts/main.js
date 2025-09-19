// Register the settings menu in your module's init hook
Hooks.on("init", function () {
    game.settings.register("nodecg-data-bridge", "selectedSystem", {
        name: "Système de jeu",
        hint: "Sélectionnez le système de jeu pour lequel charger les fichiers spécifiques.",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "generic": "Générique",
            "litm": "Legend in the Mist",
            "dungeon-world": "Dungeon World",
            "avatar-legends": "Avatar Legends"
        },
        default: "generic",
        onChange: value => {
            console.log("System changed to:", value);
            loadSystemFiles(value);
        }
    });
});

Hooks.on("ready", function () {
    const currentSystem = game.settings.get("nodecg-data-bridge", "selectedSystem");
    console.log("Fichiers chargés pour le système :", currentSystem);
    loadSystemFiles(currentSystem);
});


async function loadSystemFiles(systemId) {

    try {
        const characterPath = `./systems/${systemId}/characters.js`;
        const dicesPath = `./systems/${systemId}/dices.js`;
        const itemsPath = `./systems/${systemId}/items.js`;

        await import(characterPath);
        await import(dicesPath);
        await import(itemsPath);

        console.log(`Fichiers chargés pour le système : ${systemId}`);
    } catch (error) {
        console.error(`Échec du chargement des fichiers pour le système ${systemId} :`, error);
    }
}