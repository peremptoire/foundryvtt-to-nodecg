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

startHTMLMonitoring();

function startHTMLMonitoring() {
    // Create a MutationObserver to watch for class changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const element = mutation.target;
                // Check if this is a flex-tag-name element
                if (element.classList.contains('power-tag') ||
                    element.classList.contains('weakness-tag')
                ) {
                    checkTagStatus(element);
                }
            }
        });
    });

    // Start observing the document for class changes
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
    });
}

// Store both positive and negative selected tags globally
let positiveSelectedTags = new Set();
let negativeSelectedTags = new Set();

// Modified checkTagStatus function to handle both states
function checkTagStatus(element) {
    const isPositiveSelected = element.classList.contains('positive-selected');
    const isNegativeSelected = element.classList.contains('negative-selected');
    const tagName = element.textContent.trim();

    let status = "none";

    if (isPositiveSelected) {
        positiveSelectedTags.add(tagName);
        negativeSelectedTags.delete(tagName); // Remove from negative if present
        status = "positive-selected";
    } else if (isNegativeSelected) {
        negativeSelectedTags.add(tagName);
        positiveSelectedTags.delete(tagName); // Remove from positive if present
        status = "negative-selected";
    } else {
        // Neither selected - remove from both sets
        positiveSelectedTags.delete(tagName);
        negativeSelectedTags.delete(tagName);
        status = "none";
    }

    const statusData = {
        tagName: tagName,
        status: status,
        timestamp: new Date().toISOString(),
        userId: game.user.id
    };

    // Send character data for the affected actor
    sendCharacterDataForTag(tagName);
}

// New function to find and send character data for the actor with the changed tag
async function sendCharacterDataForTag(tagName) {
    // Find the actor that has this tag
    const actors = game.actors.contents;

    for (const actor of actors) {
        // Check if this actor has the tag in their themes
        const themes = actor.mainThemes || [];
        const hasTag = themes.some(theme => {
            const headerTag = theme.headerTag ?? theme.system?.headerTag;
            const otherPowerTags = theme.otherPowerTags ?? theme.system?.otherPowerTags;
            const weaknessTags = theme.weaknessTags ?? theme.system?.weaknessTags;

            // Normalize headerTag into an array
            const headerTags = Array.isArray(headerTag) ? headerTag : headerTag ? [headerTag] : [];

            return headerTags.some(tag =>
                (typeof tag === 'string' && tag === tagName) ||
                (tag?.name === tagName)
            ) ||
                (Array.isArray(otherPowerTags) && otherPowerTags.some(tag =>
                    (typeof tag === 'string' && tag === tagName) || tag?.name === tagName)) ||
                (Array.isArray(weaknessTags) && weaknessTags.some(tag =>
                    (typeof tag === 'string' && tag === tagName) || tag?.name === tagName));
        });


        if (hasTag) {
            const characterData = buildCharacterData(actor);
            await sendCharacterData(characterData);
        }
    }
}



Hooks.on("updateActor", async function (actor, updateData, options, userId) {

    const characterData = buildCharacterData(actor);

    await sendCharacterData(characterData);
});

window.sendCharacterStatsForActor = async function (actor) {

    const characterData = buildCharacterData(actor);

    await sendCharacterData(characterData);
};

async function sendAllCharacterData() {
    const actors = game.actors.contents;

    for (const actor of actors) {
        const characterData = buildCharacterData(actor);

        await sendCharacterData(characterData);
    }
}


function extractItemData(item) {
    return {
        id: item._id,
        name: item.name,
        type: item.type,
        subtype: item.system.subtype,
        isActive: item.system.activated_loadout,
        broad: item.system.broad,
        burnState: item.system.burn_state,
        burned: item.system.burned,
        isBonus: item.system.is_bonus,
        question: item.system.question,
        questionLetter: item.system.question_letter,
        pips: item.system.pips,
        tier: item.system.tier,
        hidden: item.system.hidden,
        improvements: item.system.improvements,
        themebookId: item.system.themebook_id,
        themebookName: item.system.themebook_name,
        themeId: item.system.theme_id,
        locale_name: item.system.locale_name,
        motivation: item.system.motivation,

    };
}

// Enhanced buildActorMainThemes function
function buildActorMainThemes(actor) {
    const themes = actor.mainThemes || [];

    return themes.map(theme => {
        const themeData = {
            themebookName: theme.themebook?.name ?? theme.system.themebook?.name,
            headerTag: theme.headerTag ?? theme.system.headerTag,
            otherPowerTags: theme.otherPowerTags ?? theme.system.otherPowerTags,
            weaknessTags: theme.weaknessTags ?? theme.system.weaknessTags
        };

        // Add status to any tag regardless of type
        const addStatusToTag = (tag) => {
            const tagName = typeof tag === 'string' ? tag : tag?.name;
            if (!tagName) return tag;

            let status = "none";
            if (positiveSelectedTags.has(tagName)) {
                status = "positive-selected";
            } else if (negativeSelectedTags.has(tagName)) {
                status = "negative-selected";
            }

            if (typeof tag === 'string') {
                return {
                    name: tag,
                    status: status
                };
            } else {
                return {
                    ...tag,
                    status: status
                };
            }
        };

        // Apply status to all tag types
        if (themeData.headerTag) {
            themeData.headerTag = themeData.headerTag.map(addStatusToTag);
        }

        if (Array.isArray(themeData.otherPowerTags)) {
            themeData.otherPowerTags = themeData.otherPowerTags.map(addStatusToTag);
        }

        if (Array.isArray(themeData.weaknessTags)) {
            themeData.weaknessTags = themeData.weaknessTags.map(addStatusToTag);
        }

        return themeData;
    });
}

// Add this to your module initialization
Hooks.on("ready", function () {
    // Start monitoring HTML changes
    startHTMLMonitoring();
});



function buildCharacterData(actor) {
    return {
        actor: actor,
        actorThemes: buildActorMainThemes(actor),
        backpack: actor.items._source
            .filter(item => item.system.subtype === "loadout")
            .map(extractItemData),
        actorId: actor.id,
        userId: game.user.id,
        timestamp: new Date().toISOString(),
        actorName: actor.name,
        /*    themekit: actor.items._source
               .filter(item => item.type === "themekit")
               .map(extractItemData),
           theme: actor.items._source
               .filter(item => item.type === "theme")
               .map(extractItemData),

           power: actor.items._source
               .filter(item => item.system.subtype === "power")
               .map(extractItemData),
           weakness: actor.items._source
               .filter(item => item.system.subtype === "weakness")
               .map(extractItemData),
           story: actor.items._source
               .filter(item => item.system.subtype === "story")
               .map(extractItemData),
           status: actor.items._source
               .filter(item => item.type === "status")
               .map(extractItemData), */
    };
}

async function sendCharacterData(characterData) {
    game.socket.emit("module.foundryvtt-to-nodecg", {
        type: "characterUpdate",
        data: characterData
    });
}

/* async function sendTagStatusUpdate(statusData) {
    game.socket.emit("module.foundryvtt-to-nodecg", {
        type: "tagStatusUpdate",
        data: statusData
    });

    console.log("Tag status sent:", statusData);
}
 */

Hooks.on("closeGame", function () {
    if (periodicTimer) {
        clearInterval(periodicTimer);
    }
});