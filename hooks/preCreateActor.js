Hooks.on("preCreateActor", async (createData) => {
    console.log("Setup new actor", createData);
    // Assign attributes that are consistent across all tokens.
    /*mergeObject(createData,
        {"token.bar1" :{"attribute" : "stamina"},
        "token.bar2" :{"attribute" : "momentum"},
        "token.name" : createData.name,
        "token.displayName" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
        "token.displayBars" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
        "token.disposition" : CONST.TOKEN_DISPOSITIONS.NEUTRAL
    })

    // Default character attributes.
    if(createData.type == "character")
    {
        createData.token.actorLink = true;
    }*/
})