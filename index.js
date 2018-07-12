const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require('fs');
const config = require("./config.json");
const warns = JSON.parse(fs.readFileSync("./warnings.json", "utf8"));
const ms = require('ms')

client.on("ready", () => {
  console.log("I am ready!");
});

client.on("message", async message => {

  if(message.author.bot) return;
  if(message.channel.type === "dm") return;

  let prefixes = JSON.parse(fs.readFileSync("./prefix.json", "utf8"));
  let embeds = JSON.parse(fs.readFileSync("./embed.json", "utf8"));

  if(!embeds[message.guild.id]){
    embeds[message.guild.id] = {
      embeds: config.embeds
    }
  }

  if(!prefixes[message.guild.id]){
    prefixes[message.guild.id] = {
      prefixes: config.prefixes
    }
  }

  let prefix = prefixes[message.guild.id].prefixes;
  let eColor = embeds[message.guild.id].embeds;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();

  if(cmd === `help`){
    const hEmbed = new Discord.RichEmbed()
    .setColor(eColor)
    .setAuthor("Brontide Bot", "https://cdn.discordapp.com/attachments/466783305979789322/466996489823059968/logo.png")
    .setTitle("Brontide Bot Help")
    .addField("!help", "Displays this help embed")
    .addField("!kick", "Kicks a User")
    .addField("!ban", "Bans a user")
    .addField("!purge", "Purge a set amount of messages")
    .addField("!warn", "Warn a user. 3 warnings results in a mute, 5 warnings results in a ban")
    .addField("!clearwarns", "Clears a user's warnings (resets to 0)")
    .addField("!warningcheck", "Check a user's number of warnings")
    .addField("!clear", "Deletes all bot messages.")
    .addField("!setprefix", "Sets the bot's prefix (default: !)")
    .addField("!setembed", "Sets the embed color.")
    .setTimestamp();

    message.channel.send(hEmbed);

  }

  if(cmd === `warn`){
    if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("Sorry, you don't have enough permission to do that!");
    if(!args[0] || args[0] === "help") return message.channel.send("Usage: !warn <user> <reason>");
    let wUser = message.guild.member(message.mentions.members.first());

    if(!wUser) return message.channel.send("Usage: !warn <user> <reason>");
    if(wUser.hasPermission("MANAGE_MESSAGES")) return message.channel.send("That person can't be warned!");

    let reason = args.join(" ").slice(22);

    if(!reason) return message.channel.send("You didn't specify a reason!")

    if(!warns[wUser.id]) warns[wUser.id] = {
      warns: 0
    }

    warns[wUser.id].warns++;

    fs.writeFile("./warnings.json", JSON.stringify(warns), (err) => {
      if (err) console.log(err);
    })

    let wEmbed = new Discord.RichEmbed()
    .setDescription("Warns")
    .setAuthor(message.author.username)
    .setColor(eColor)
    .addField("Warned User", wUser.tag)
    .addField("Warned In", message.channel)
    .addField("Number of Warnings", warns[wUser.id].warns)
    .addField("Reason", reason);

    message.channel.send(wEmbed); 

    if(warns[wUser.id].warns == 3){
      let muterole = message.guild.roles.find("name", "muted");
      if(!muterole){
        try{
          muterole = await message.guild.createRole({
            name: "muted",
            color: "#000000",
            permissions:[]
          })
          message.guild.channels.forEach(async (channel, id) => {
            await channel.overwritePermissions(muterole, {
              SEND_MESSAGES: false,
              ADD_REACTIONS: false
            });
          });
        }catch(e){
          console.log(e.stack);
        }
      }

      let mutetime = "1h";
      await(wUser.addRole(muterole.id));
      message.channel.send(`<@${wUser.id}> has been muted for 1 hour.`);

      setTimeout(function() {
        wUser.removeRole(muterole.id)
        message.channel.reply(`<@${wUser.tag}> has been unmuted.`)
      }, ms(mutetime))
    }

    if(warns[wUser.id].warns == 5){
      message.guild.member(wUser).ban("Too many warnings!");

      message.channel.send(`<@${wUser.id}> has been banned since they recieved too many warnings!`)
    }

    

  }

  if(cmd === `warningcheck`){
    if(!args[0] || args[0] === "help") return message.channel.send("Usage: !warningcheck <user>");
    let wUser = message.guild.member(message.mentions.members.first());

    if(!wUser) return message.channel.send("Usage: !warningcheck <user>");

    message.channel.send("That user has " + warns[wUser.id].warns + " warnings.")
  }
  if(message.content.toLowerCase().startsWith(prefix + "clearwarns")){
    if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("Sorry, you don't have enough permission to do that!");
    if(!args[0] || args[0] === "help") return message.channel.send("Usage: !clearwarns <user>");
    let wUser = message.guild.member(message.mentions.members.first());

    if(!wUser) return message.channel.send("Usage: !clearwarns <user>");

    var i;

    if (warns[wUser.id].warns > 0)
    {
      for(i = warns[wUser.id].warns; i > 0; i--){
      warns[wUser.id].warns -= 1;
      }
    }


    
    fs.writeFile(`./warnings.json`, JSON.stringify(warns), (err) => {
      if (err) console.log(err);
    });


    message.channel.send("User's warnings have been reset to 0!")

  }

  if(message.content.toLowerCase().startsWith(prefix + "addrole")){
    if(!message.member.hasPermission("MANAGE_ROLES")) return message.channel.send("Sorry, you don't have enough permission to do that!");

    let rUser = message.guild.member(message.mentions.members.first());

    let uRole = args.join(" ").slice(22);

    let role = message.guild.roles.find("name", uRole);

    if(!role) return message.channel.send("Sorry but that role doesn't exist!")

    if(rUser.roles.find("name", uRole)) return message.channel.send("That user already has that role!");

    rUser.addRole(role);

    const rEmbed = new Discord.RichEmbed()
    .setColor(eColor)
    .setAuthor("Brontide Bot", "https://cdn.discordapp.com/attachments/466783305979789322/466996489823059968/logo.png")
    .addField("Role given!", "The user has been given the role.")
    message.channel.send(rEmbed);
  }

  if(message.content.toLowerCase().startsWith(prefix + "removerole")){
    if(!message.member.hasPermission("MANAGE_ROLES")) return message.channel.send("Sorry, you don't have enough permission to do that!");

    let rUser = message.guild.member(message.mentions.members.first());

    let uRole = args.join(" ").slice(22);

    let role = message.guild.roles.find("name", uRole);

    if(!role) return message.channel.send("Sorry but that role doesn't exist!")

    if(!rUser.roles.find("name", uRole)) return message.channel.send("That user doesn't have that role!");

    rUser.removeRole(role);

    const rEmbed = new Discord.RichEmbed()
    .setColor(eColor)
    .setAuthor("Brontide Bot", "https://cdn.discordapp.com/attachments/466783305979789322/466996489823059968/logo.png")
    .addField("Role given!", "The user has been removed from the role.")
    message.channel.send(rEmbed);
  }

  if(cmd === `purge`) {
    // This command removes all messages from all users in the channel, up to 100.
    // get the delete count, as an actual number.
    const deleteCount = parseInt(args[0], 10);
    
    // Ooooh nice, combined conditions. <3
    if(!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");

      
    // So we get our messages, and delete them. Simple enough, right?
    const fetched = await message.channel.fetchMessages({count: deleteCount});
    message.channel.bulkDelete(deleteCount + 1)
      .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
}

  if(message.content.toLowerCase().startsWith(prefix + "setembed")){
    if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("Sorry, you don't have permission to do that!");
    if(!args[0] || args[0] === "help") return message.channel.send("Usage: !setembed <desired hexcolor>");
    if(args[0].length !== 6) return message.channel.send("That doesn't appear to be a hex color, sorry!")

    let embeds = JSON.parse(fs.readFileSync("./embed.json", "utf8"));

    embeds[message.guild.id] = {
      embeds: args[0]
    }

    fs.writeFile("./embed.json", JSON.stringify(embeds), (err)=> {
      if (err) console.log(err);
    });

    let eEmbed = new Discord.RichEmbed()
    .setColor(eColor)
    .setTitle("Embed color set!")
    .setDescription("New color: " + args[0]);

    message.channel.send(eEmbed);
  }

  if(message.content.toLowerCase().startsWith(prefix + "setprefix")){
    if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("Sorry, you don't have permission to do that!");
    if(!args[0] || args[0] === "help") return message.channel.send("Usage: !setprefix <desired prefix>");

    let prefixes = JSON.parse(fs.readFileSync("./prefix.json", "utf8"));

    prefixes[message.guild.id] = {
      prefixes: args[0]
    };

    fs.writeFile("./prefix.json", JSON.stringify(prefixes), (err)=> {
      if (err) console.log(err);
    });

    let sEmbed = new Discord.RichEmbed()
    .setColor(eColor)
    .setTitle("Prefix set!")
    .setDescription("New prefix: " + args[0]);

    message.channel.send(sEmbed);
  }

  if(message.content.toLowerCase().startsWith(`${prefix}kick`)){
    let kUser = message.guild.member(message.mentions.members.first());
    if(!kUser) message.channel.send("Can't find that user!");
    let kReason = args.join(" ").slice(22);
    if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("Sorry, you don't have enough permission!");

    let kickEmbed = new Discord.RichEmbed()
    .setDescription("Kick")
    .setColor("003459")
    .addField("Kicked User", `${kUser}`)
    .addField("Kicked By", `<@${message.author.id}>`)
    .addField("Kicked in", message.channel)
    .addField("Reason", kReason)
    .addField("Time", message.createdAt)
    

    message.guild.member(kUser).kick("has been kicked.");
    message.channel.send(kickEmbed);

    return;
  }

  if (message.content.startsWith(`${prefix}ban`)){
    //=kick @cuay Offensive Language

    let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!bUser) message.channel.send("Can't find that user!");
    let bReason = args.join(" ").slice(22);
    if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("Sorry, I don't have enough permission!");
    if(!bReason) return message.channel.send("You didn't specify a reason!");

    let banEmbed = new Discord.RichEmbed()
    .setDescription("Ban")
    .setColor(eColor)
    .addField("Banned User", `${bUser}`)
    .addField("Banned By", `<@${message.author.id}>`)
    .addField("Banned in", message.channel)
    .addField("Time", message.createdAt)
    .addField("Reason", bReason);

    message.guild.member(bUser).ban(bReason);
    message.channel.send(banEmbed);

    return;

}

  if(cmd === `clear`){
    if (message.channel.type == 'text') {
      message.channel.fetchMessages().then(messages => {
          const botMessages = messages.filter(msg => msg.author.bot);
          message.channel.bulkDelete(botMessages);
          messagesDeleted = botMessages.array().length; // number of messages deleted
  
          // Logging the number of messages deleted on both the channel and console.
          console.log('Deletion of messages successful. Total messages deleted: ' + messagesDeleted)
      }).catch(err => {
          console.log('Error while doing Bulk Delete');
          console.log(err);
      });
  }
  }

});

client.login("NDY2ODI0NTE1ODI2MDg5OTg1.DihruQ.Y2WlJPqXHcX5-82HMhzLrhQ5-po");