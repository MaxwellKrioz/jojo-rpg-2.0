/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

 import{
  _announceInitiativeUse
 }from "./combat.js"
import { _jojoLog } from "./utils.js";
 

export class SimpleActorSheet extends ActorSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
  	  classes: ["worldbuilding", "sheet", "actor"],
  	  template: "systems/jojo-rpg/templates/actor-stand-user-sheet.html",
      width: 745,
      height: 660,
      tabs: [
        {navSelector: ".image-nav", contentSelector: ".image-tabs", initial: "profile"},
        {navSelector: ".profile-nav", contentSelector: ".profile-tabs", initial: "sumary"}
      ],
      //dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get template() {
    return `systems/jojo-rpg/templates/actor-${this.actor.type}-sheet.html`;
  }

  async getData() {
    const context = super.getData();
    console.log("------------------");
    console.log(game);
    console.log("------------------");
    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor.system;
    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData;
    context.flags = actorData.flags;
    switch (context.actor.type){
      case 'character':
        context.actorTypeLabel = 'Usuario de stand'
        break;
      case 'stand':
        context.actorTypeLabel = 'Stand'
        break;
      default:
        context.actorTypeLabel = '???'
    }
    if (context.actor.type == 'character') {
      const stands = await this.getStands(actorData.id);
      context.standList = stands;
    }else{      
      const user = await this.getMyUser(actorData.characterId);
      const allUsers = await this.getStandUsers();
      context.standUser = user;
      context.allUsers = allUsers;
    }
    context.isGM = game.user.isGM;
    console.log("@nova context", context);
    return context;
  }

  _returnRollFormula(requestedRank, modifierArray)
  {
    let diceRoll;
    let modifier = '';
    switch(requestedRank.toUpperCase()) {
      case "A":
        diceRoll = "3d20kh";
        break;
      case "B":
        diceRoll = "2d20kh";
        break;
      case "C":
        diceRoll = "1d20";
        break;
      case "D":
        diceRoll = "2d20kl";
        break;
      case "E":
        diceRoll = "3d20kl";
        break;
      default:
        diceRoll = "1d4";
    }
    
    if(modifierArray){
      const arraynames = Object.keys(modifierArray);
      const modifierString = arraynames.map( label => {
        return '@'+label
      });

      modifier = ' + '+modifierString.join(' + ');
    }

    console.log("M1",requestedRank, diceRoll);
    
    console.log(`${diceRoll}${modifier}`)

    return new Roll(`${diceRoll}${modifier}`, modifierArray);
  }

  async _presetRoll(event){
    event.preventDefault();
    const element = event.currentTarget;
    const btnRank = element.value;
    const actorRollModifier = this.actor.system.rollmodifier.value;
    const actorMomentum = Math.min(this.actor.system.rollmodifier.value, 3);

    const roll = this._returnRollFormula(btnRank, {momentum: actorMomentum, rollModifier: actorRollModifier});
    await roll.roll();
    let fResult = Number(roll.total);
    let adjustedRoll = "";
    let styleOverride = "";
    let html = "";
    let label = "Making a character " + btnRank.toUpperCase() + "-Rank roll.";

    switch(true)
    {
      case (fResult <= 0):
        adjustedRoll = "CRITICAL FAILURE";
        styleOverride="background-color: #434343; color:#ffffff";
      break;

      case(fResult <=5):
        adjustedRoll = "DEFINITE FAILURE";
        styleOverride="background-color: #674ea7; color:#ffffff";
      break;

      case(fResult <=10):
        adjustedRoll = "MODERATE FAILURE";
        styleOverride="background-color: #3d85c6; color:#ffffff";
      break;

      case(fResult <=15):
        adjustedRoll = "MODERATE SUCCESS";
        styleOverride="background-color: #ffd966";
      break;

      case(fResult <= 20):
        adjustedRoll = "DEFINITE SUCCESS";
        styleOverride="background-color: #ff9900";
      break;

      case (fResult >= 21):
        adjustedRoll = "CRITICAL SUCCESS";
        styleOverride="background-color: #e06666";
      break;
    }

    html = `<div class="dice-roll">`
    html += `     <div class="dice-result">`
    html += `     <div style="${styleOverride}" class="dice-formula">${adjustedRoll}</div>`
    html += `     <div class="dice-tooltip">`
    html += `          <section class="tooltip-part">`
    html += `               <div class="dice">`
    html += `                    <p class="part-formula">`
    html += `                         ${roll.result}`
    html += `                         <span class="part-total">${fResult.toString()}</span>`
    html += `                    </p>`
    html += `                    <ol class="dice-rolls">`
    html += `                         <li class="roll die ${roll.result}">${roll.total}</li>`
    html += `                    </ol>`
    html += `               </div>`
    html += `          </section>`
    html += `     </div>`
    html += `     <h4 class="dice-total">${fResult}</h4>`
    html += `</div>`

    let chatData = {
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      rolls: [roll],
      content: html,
      flavor: label
      //etc.
   };

    ChatMessage.applyRollMode(chatData, "roll");
    ChatMessage.create(chatData);

    
   

/*
    console.log(fResult);
    

      let chatData = {
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: html,
      flavor: label
      };

      AudioHelper.play({src: "sounds/dice.wav", volume: 0.8, autoplay: true, loop: false}, true);

      ChatMessage.create(chatData, {});
      */
  }

  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if(dataset.roll){
      let roll;

      console.log(dataset.ranking);
      
      roll = this._returnRollFormula(dataset.ranking);

      let modifier = document.getElementById(this.actor._id+'-modifier-box').value;
      let momentum = dataset.momentum;

      await roll.roll();
      let fResult = Number(roll.total) + Number(modifier) + Number(momentum);
      let adjustedRoll = "";
      let styleOverride = "";
      let html = "";
      let label = dataset.label ? `Rolling Stand ${dataset.label} (RANK ${dataset.ranking}).` : '';

      console.log(fResult);
      switch(true)
      {
        case (fResult <= 0):
          adjustedRoll = "CRITICAL FAILURE";
          styleOverride="background-color: #434343; color:#ffffff";
        break;

        case(fResult <=5):
          adjustedRoll = "DEFINITE FAILURE";
          styleOverride="background-color: #674ea7; color:#ffffff";
        break;

        case(fResult <=10):
          adjustedRoll = "MODERATE FAILURE";
          styleOverride="background-color: #3d85c6; color:#ffffff";
        break;

        case(fResult <=15):
          adjustedRoll = "MODERATE SUCCESS";
          styleOverride="background-color: #ffd966";
        break;

        case(fResult <= 20):
          adjustedRoll = "DEFINITE SUCCESS";
          styleOverride="background-color: #ff9900";
        break;

        case (fResult >= 21):
          adjustedRoll = "CRITICAL SUCCESS";
          styleOverride="background-color: #e06666";
        break;
      }

    html = `<div class="dice-roll">`
    html += `     <div class="dice-result">`
    html += `     <div style="${styleOverride}" class="dice-formula">${adjustedRoll}</div>`
    html += `     <div class="dice-tooltip">`
    html += `          <section class="tooltip-part">`
    html += `               <div class="dice">`
    html += `                    <p class="part-formula">`
    html += `                         ${roll.result} + (momentum) + (other)`
    html += `                         <span class="part-total">${fResult.toString()}</span>`
    html += `                    </p>`
    html += `                    <ol class="dice-rolls">`
    html += `                         <li class="roll die ${roll.result}">${roll.total}+${momentum}+${modifier}</li>`
    html += `                    </ol>`
    html += `               </div>`
    html += `          </section>`
    html += `     </div>`
    html += `     <h4 class="dice-total">${fResult}</h4>`
    html += `</div>`

      let chatData = {
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: html,
      flavor: label
      };

      AudioHelper.play({src: "sounds/dice.wav", volume: 0.8, autoplay: true, loop: false}, true);

      ChatMessage.create(chatData, {});

      /*rollOutcome.toMessage({
        speaker: ChatMessage.getSpeaker({actor: this.actor}),
        flavor: label
      });

      let resultChatData = {
        content: adjustedRoll
      };

      ChatMessage.create(resultChatData);*/
    }
  }

  async getStandUsers() {
    const allActors = game.actors;
    
    if(!allActors) return {}
    
    const standusers = allActors.filter(actor =>{
      return actor.type == 'character';
    });
    const mappedUsers = standusers.map(actor=>{
      return {
        id: actor.id,
        name: actor.name
      }
    });
    console.log("stand Users: ", mappedUsers);
    let baseList = [
      {
        id: "",
        name: "???"
      }
    ];
    
    return baseList.concat(mappedUsers);
  }

  async getStands(actorId){
    const allActors = game.actors;    
    if(!allActors) return {}

    const stands = allActors.filter(actor =>{
      return actor.type == 'stand' && actor.system.characterId == this.actor.id;
    });
    console.log(this.actor, allActors);
    console.log("My stands", stands);
    return stands
  }

  async getMyUser(actorId){
    const myActor = game.actors.get(actorId);
    console.log("My User: ", myActor);
    return myActor
  }

  async getToken(){}

  /*_setStandImage(event)
  {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    let url = dataset.standImageURL;
    console.log(standImageURL);
  }*/

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    //Update Stand Stats
    //Update Stand User
    html.find('#currentStandUser').change(async event => {
      this.actor.system.characterId = event.target.value;
      await this.actor.update();
    });


    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    html.find('.'+this.actor._id+'-modifier-button-inc').click(ev => {
      var value = parseInt(document.getElementById(this.actor._id+'-modifier-box').value, 10);
      value = isNaN(value)? 0 : value;
      value++;
      document.getElementById(this.actor._id+'-modifier-box').value = value;
    });

    html.find('.'+this.actor._id+'-modifier-button-dec').click(ev => {
      var value = parseInt(document.getElementById(this.actor._id+'-modifier-box').value, 10);
      value = isNaN(value)? 0 : value;
      value--;
      document.getElementById(this.actor._id+'-modifier-box').value = value;
    });

    html.find('.'+this.actor._id+'-modifier-button-rst').click(ev => {
      var value = parseInt(document.getElementById(this.actor._id+'-modifier-box').value, 10);
      value = isNaN(value)? 0 : value;
      value = 0;
      document.getElementById(this.actor._id+'-modifier-box').value = value;
    });

    html.find('.'+this.actor._id+'-mominc').click(ev => {
      var value = parseInt(document.getElementById(this.actor._id+'-increment-box').value, 10);
      value = isNaN(value)? 0 : value;
      value++;
      if(value > 3)
        value = 3;
      document.getElementById(this.actor._id+'-increment-box').value = value;
    });

    html.find('.'+this.actor._id+'-momdec').click(ev => {
      var value = parseInt(document.getElementById(this.actor._id+'-increment-box').value, 10);
      value = isNaN(value)? 0 : value;
      value--;
      if(value < -3)
        value = -3;
      document.getElementById(this.actor._id+'-increment-box').value = value;
    });

    html.find('.'+this.actor._id+'-LightWounds-Inc').click(ev => {
      var value = parseInt(document.getElementById(this.actor._id+'-currentlightwounds').value, 10);
      value = isNaN(value)? 0 : value;
      value++;
      document.getElementById(this.actor._id+'-currentlightwounds').value = value;
    });

    html.find('.'+this.actor._id+'-LightWounds-Dec').click(ev => {
      var value = parseInt(document.getElementById(this.actor._id+'-currentlightwounds').value, 10);
      value = isNaN(value)? 0 : value;
      value--;
      if(value < 0)
        value = 0;
      document.getElementById(this.actor._id+'-currentlightwounds').value = value;
    });

    html.find('.'+this.actor.system._id+'-grab-url').click(ev => {
      var url = this.actor.system.data.standImageURL;
      console.log(url);
      //console.log(document.getElementById('stand-img-view'));
      //console.log(this.actor);

      if(url)
        html.find('.'+this.actor.system._id+'-standImgView').src = url;
      else
        html.find('.'+this.actor.system._id+'-standImgView').src = "/systems/jojo-rpg/images/Stand_Img_Placeholder.png"; 
      /*if(url)
        document.getElementById('stand-img-view').src = url;
      else
        document.getElementById('stand-img-view').src = "/systems/jojo-rpg/images/Stand_Img_Placeholder.png";
      */
      //this.actor.update();
    });

    html.find('.initiative-button').click(ev => {

      if(game.combat === null)
      {
        _jojoLog("No combat exists!");
        ChatMessage.create({
        content: "No combat has been started yet!",
        type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
        whisper: [game.user.id]
      });
      
      return;
      }

      var id = this.actor._id;
      var combatants = game.combat.combatants;
      var linkedCombatant;
      var actorCanAct;

      _jojoLog(id);
      console.log(combatants);

      for(let i = 0; i < combatants.length; i++)
      {
        var combatantData = combatants[i].actor.system;
        if(combatantData._id == id)
        {
          _jojoLog("Found ID match!");
          linkedCombatant = combatants[i];
        }
      }

      
      actorCanAct = this.actor.system.data.canAct;


      if(linkedCombatant)
      {
        game.combat.setInitiative(linkedCombatant._id, 0);

        if(actorCanAct == true)
        {
          this.actor.update({'data.canAct': false});
          //linkedCombatant.actor.update({'data.canAct': false});
          _announceInitiativeUse(this.actor.system);
        }else{
          _jojoLog("This actor cannot act yet!");
          ChatMessage.create({
          content: "You've already used your initiative for this round!",
          type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
          whisper: [game.user.id]
        });
      }
      }else{
        _jojoLog("This actor is not a part of any combat!");
        ChatMessage.create({
        content: "You must be part of a combat to use your initiative!",
        type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
        whisper: [game.user.id]
      });
      }


      //console.log(this.actor.system.data);
      //console.log(game.combat.combatants);

      //_jojoLog(canAct);
    });

    html.find('.initiative-checkbox').click(ev => {
      var canAct = this.actor.system.canAct;
      var combatants = game.combat.combatants;
      //console.log(canAct);
      //console.log(this.actor);
      //console.log(combatants);
      
      var playerCombatantId;

      if(game.combat != null && combatants != undefined)
      {
        var combatants = game.combat.combatants;
        console.log(combatants);

        for(var i = 0; i < combatants.length; i++){
          if(combatants[i] == undefined)
            return;

          if(combatants[i].actor.system._id == this.actor.system._id && combatants[i].token != undefined)
          {
            playerCombatantId = combatants[i]._id;
            //console.log("MATCH!");
          }
        }

        if(canAct && playerCombatantId !== 'undefined')
        {
          //console.log("has acted");
          game.combat.setInitiative(playerCombatantId, 0);
          _announceInitiativeUse(this.actor.system);
        }else if(playerCombatantId !== 'undefined'){
          //console.log("has not acted");
          game.combat.setInitiative(playerCombatantId, 1);
        }
      }
    });

    /*html.find('.preset-roll-btn').click(env=>{
      var rankValue = $(this).value;
      console.log("clicked " + rankValue.toString());
    });*/

    html.find('.preset-roll-btn').click(this._presetRoll.bind(this));

    html.find('.rollable').click(this._onRoll.bind(this));


    if(this.actor.system.standImageURL)
    {
      if(document.getElementById(this.actor.system._id+'-stand-img-view'))
      {
        document.getElementById(this.actor.system._id+'-stand-img-view').src = this.actor.system.standImageURL;
        //this.actor.update();
      }
    }
  }
}
