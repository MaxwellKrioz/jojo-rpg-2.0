Hooks.on("createActor", async (document) => {  
    console.log("just creating ", document);
    const name = document.name;
    const system = document.system;
    const actorId = document.id;
    if(document.type === "character"){
        console.log("creating a stand for "+name, system);
        let actor = await Actor.create({
            name: "Stand of "+name,
            type: "stand",
            img: "icons/svg/mystery-man.svg"
          });
        const newActorid = actor.id;
        console.log(newActorid);
        const updates = [{_id: newActorid, "system.characterId": actorId}];
        const updated = await Actor.updateDocuments(updates);
        console.log("----------------------");
        console.log(updated);
        console.log("----------------------");
    }
});