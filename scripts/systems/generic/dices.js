import {
    parseRawContentToGenericJson,
    containsDiceRollHTML,
    determineRollSource
} from "../../scripts/utils.js";

// =============================
// Dice Roll Bridge
// =============================

Hooks.on("init", function () {
    console.log("Dice Roll Bridge module initialized");
});

Hooks.on("ready", function () {
    console.log("Dice Roll Bridge ready");
});

Hooks.on("preCreateChatMessage", async function (msg) {
    const rollData = await extractUnifiedRollData(msg);
    if (rollData && rollData.rolls.length > 0) {
        await sendDiceRollData(rollData);
        if (game.user.isGM) {
        }
    }
});

// -----------------------------
// Dice Roll Extraction
// -----------------------------
async function extractUnifiedRollData(msg) {
    const unifiedData = {
        timestamp: msg.timestamp,
        blind: msg.blind,
        messageId: msg.id || foundry.utils.randomID(),
        userId: msg.author?.id || game.author.id,
        userName: msg.author?.name || game.author.name,
        speaker: msg.speaker,
        source: determineRollSource(msg),
        rolls: [],
        raw: msg.content,
        rawContent: parseRawContentToGenericJson(msg.content)
    };

    if (msg.isRoll && msg.rolls && msg.rolls.length > 0) {
        for (let roll of msg.rolls) {
            if (!roll._evaluated) await roll.evaluate();
            unifiedData.rolls.push(extractStandardRollData(roll));
        }
        return unifiedData;
    }
    else if (msg.content && containsDiceRollHTML(msg.content)) {
        const parsedRolls = parseHTMLRollData(msg.content);
        if (parsedRolls.length > 0) {
            unifiedData.rolls = parsedRolls;
            return unifiedData;
        }
    }
    return null;
}

function extractStandardRollData(roll) {
    const rollInfo = {
        formula: roll.formula,
        total: roll.total,
        terms: []
    };

    for (let term of roll.terms) {
        if (term instanceof foundry.dice.terms.Die) {
            rollInfo.terms.push({
                type: "die",
                number: term.number,
                faces: term.faces,
                results: term.results.map(r => ({
                    result: r.result,
                    active: r.active,
                    discarded: r.discarded
                })),
                total: term.total
            });
        } else if (term.constructor.name === "NumericTerm") {
            rollInfo.terms.push({
                type: "numeric",
                number: term.number
            });
        }
    }

    return rollInfo;
}

function parseHTMLRollData(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const rolls = [];

    const rollElements = doc.querySelectorAll('[data-roll-total], .dice-total, .roll-total');
    const formulaElements = doc.querySelectorAll('.dice-formula, .roll-formula');

    if (rollElements.length > 0) {
        rollElements.forEach((element, index) => {
            const total = element.getAttribute('data-roll-total') ||
                element.textContent.match(/\d+/)?.[0];
            const formula = formulaElements[index]?.textContent || "unknown";

            if (total) {
                rolls.push({
                    formula: formula,
                    total: parseInt(total),
                    source: "html_parsed",
                    terms: parseIndividualDiceFromHTML(doc, index)
                });
            }
        });
    }

    return rolls;
}

function parseIndividualDiceFromHTML(doc) {
    const terms = [];
    const diceElements = doc.querySelectorAll('.dice-rolls li, .die-result, [class*="die"]');

    diceElements.forEach(die => {
        const result = die.textContent.match(/\d+/)?.[0];
        if (result) {
            terms.push({
                type: "die_parsed",
                result: parseInt(result),
                classes: die.className
            });
        }
    });

    return terms;
}

// -----------------------------
// Outbound socket
// -----------------------------
async function sendDiceRollData(rollData) {
    game.socket.emit("module.foundryvtt-to-nodecg", {
        type: "diceRoll",
        data: rollData
    });
}
