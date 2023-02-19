//Prepare connection to Discord API
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.DIRECT_MESSAGES
  ]
});

// Set up message handler for Discord
client.on('messageCreate', async (message) => {
  // Stop if message is from a bot or if the game is over
  if (message.author.bot || isBossDefeated) {
    return;
  }

  // Add this line to ignore messages not starting with the command prefix '!'
  if (!message.content.startsWith('!')) {
    return;
  }

  // Fetch the message history
  const messages = await message.channel.messages.fetch();

  // Check if the message is the "!scenario" command
  let history = messages
    .reverse()
    .filter(m => !m.author.bot && m.content.trim().length > 0)
    .map(m => `${m.author.username}: ${m.content}`)
    .join('\n');

  if (message.content === '!scenario') {
    // Reset game variables
    bossHealth = 1000;
    planetHealth = 1000;
    isBossDefeated = false;

    // Generate scenario
    openai.createCompletion({
      model: "text-davinci-003",
      prompt: gameScenario + history,
      max_tokens: 200,
      temperature: 1,
      presence_penalty: 1,
      frequency_penalty: 1.5,
    }).then((response) => {
      // Extract the generated scenario from the OpenAI response
      const scenario = response.choices[0].text;
      // Send the scenario to the Discord channel
      console.log(`Generated scenario: ${scenario}`);
      if (scenario && scenario.trim().length > 0) {
        message.channel.send(scenario);
      } else {
        message.channel.send('Sorry, I could not generate a scenario at this time. Please try again later.');
      }
    }).catch((err) => {
      console.error(err);
      message.channel.send('An error occurred while processing your command. Please try again later.');
    });
  }

  // Check if the message is an attack, defend, or heal command
  else if (message.content.startsWith('!')) {
    const command = message.content.slice('!'.length).trim().split(' ')[0];

    if (command === 'attack') {
      try {
        if (bossHealth <= 0) {
          // Display message that the boss is already defeated
          message.channel.send('The boss is already defeated. Start a new game with !scenario command.');
        } else {
          // Reduce the boss's health by 100
          bossHealth = Math.max(0, bossHealth - 100);

          // Send a message to the channel indicating that the player has attacked the boss
          message.channel.send(`Player ${message.author.username} has attacked the boss for 100 damage!`);

          if (bossHealth <= 0) {
            // Display message that the boss is defeated
            message.channel.send('The boss is defeated. Start a new game with !scenario command.');
            isBossDefeated = true;
          } else {
            // Send a message to the channel indicating the new health of the boss
            message.channel.send(`The boss's health is now ${bossHealth}.`);
          }
        }
      } catch (err) {
        console.error(err);
        message.channel.send('An error occurred while processing your command. Please try again later.');
      }
    } else if (command === 'defend') {
      try {
        // Reduce the player's planet's health by 50
        planetHealth -= 50;

        // Send a message to the channel indicating that the player has defended their planet
        message.channel.send(`Player ${message.author.username} has defended their planet, reducing its health by 50.`);

        // Send a message to the channel indicating the new health of the player's planet
        message.channel.send(`The player's planet's health is now ${planetHealth}.`);
      } catch (err) {
        console.error(err);
        message.channel.send('An error occurred while processing your command. Please try again later.');
      }
    } else if (command === 'heal') {
      try {
        // Increase the player's planet's health by 50
        planetHealth += 50;

        // If the player's planet's health exceeds the maximum, set it back to the maximum
        if (planetHealth > 1000) {
          planetHealth = 1000;
        }

        // Send a message to the channel indicating that the player has healed their planet
        message.channel.send(`Player ${message.author.username} has healed their planet, restoring its health by 50.`);

        // Send a message to the channel indicating the new health of the player's planet
        message.channel.send(`The player's planet's health is now ${planetHealth}.`);
      } catch (err) {
        console.error(err);
        message.channel.send('An error occurred while processing your command. Please try again later.');
      }
    } else if (command === 'use') {
      try {
        const item = message.content.slice('!'.length).trim().split(' ')[1];
        // Use the specified item
        if (item === 'laser cannon') {
          // Reduce the boss's health by 500
          bossHealth = Math.max(0, bossHealth - 500);

          // Send a message to the channel indicating that the player has used the laser cannon
          message.channel.send(`Player ${message.author.username} has used the laser cannon to deal 500 damage to the boss!`);

          if (bossHealth <= 0) {
            // Display message that the boss is defeated
            message.channel.send('The boss is defeated. Start a new game with !scenario command.');
            isBossDefeated = true;
          } else {
            // Send a message to the channel indicating the new health of the boss
            message.channel.send(`The boss's health is now ${bossHealth}.`);
          }
        } else if (item === 'shield generator') {
          // Increase the player's planet's health by 500
          planetHealth += 500;

          // If the player's planet's health exceeds the maximum, set it back to the maximum
          if (planetHealth > 1000) {
            planetHealth = 1000;
          }

          // Send a message to the channel indicating that the player has used the shield generator
          message.channel.send(`Player ${message.author.username} has used the shield generator to protect their planet, restoring its health by 500.`);

          // Send a message to the channel indicating the new health of the player's planet
          message.channel.send(`The player's planet's health is now ${planetHealth}.`);
        }
      } catch (err) {
        console.error(err);
        message.channel.send('An error occurred while processing your command. Please try again later.');
      }
    }
  }
});
// Log in to Discord
client.login(process.env.DISCORD_TOKEN);
// Start the bot
console.log("ChatGPT is running");
