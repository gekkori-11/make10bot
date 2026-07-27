const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

require("dotenv").config();


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});


// /make10 コマンド
const commands = [

  new SlashCommandBuilder()
    .setName("make10")
    .setDescription("Make10問題を出します"),

  new SlashCommandBuilder()
    .setName("answer")
    .setDescription("答えを入力します")
    .addStringOption(option =>
      option
        .setName("formula")
        .setDescription("計算式を入力してください")
        .setRequired(true)
    )

];


client.once("ready", async () => {

  console.log(
    `${client.user.tag} 起動しました`
  );


  const rest = new REST({
    version: "10"
  }).setToken(
    process.env.DISCORD_TOKEN
  );


  await rest.put(

    Routes.applicationCommands(
      client.user.id
    ),

    {
      body:
commands.map(c => c.toJSON())
    }

  );


  console.log(
    "コマンド登録完了"
  );

});



// Discordイベント
client.on(
"interactionCreate",
async interaction => {



  // ====================
  // /make10
  // ====================

  if(
    interaction.isChatInputCommand()
    &&
    interaction.commandName === "make10"
  ){


    await interaction.deferReply();


    // GASへ問題作成依頼
    const response =
      await fetch(
        process.env.GAS_URL,
        {

          method:"POST",

          headers:{
            "Content-Type":
            "application/json"
          },

          body:JSON.stringify({

            action:"create"

          })

        }
      );



    const data =
      await response.json();



    const button =
      new ButtonBuilder()

      .setCustomId(
        "answer_" + data.id
      )

      .setLabel(
        "答えを出す"
      )

      .setStyle(
        ButtonStyle.Primary
      );



    const row =
      new ActionRowBuilder()
      .addComponents(button);



    await interaction.editReply({

  content:
    data.numbers.join("  "),

  components:[
    row
  ]

});


  }

// ====================
// /answer
// ====================

if(
  interaction.isChatInputCommand()
  &&
  interaction.commandName === "answer"
){

  const formula =
    interaction.options
    .getString("formula");


  try {

    const result =
      Function(
        "return " + formula
      )();


    if(
      Math.abs(result - 10)
      < 0.000001
    ){

      await interaction.reply(
        "正解"
      );

    } else {

      await interaction.reply(
        "不正解です\n答えは10になりません"
      );

    }


  } catch(e){

    await interaction.reply(
      "計算式を確認してください"
    );

  }

}


  // ====================
  // 答えボタン
  // ====================

  if(
    interaction.isButton()
  ){


    if(
      interaction.customId
      .startsWith("answer_")
    ){


      const id =
        interaction.customId
        .replace(
          "answer_",
          ""
        );



      const response =
        await fetch(

          process.env.GAS_URL,

          {

            method:"POST",

            headers:{
              "Content-Type":
              "application/json"
            },


            body:JSON.stringify({

              action:"answer",

              id:id

            })

          }

        );



      const data =
        await response.json();



      await interaction.reply({

        content:

        "**答え**\n" +

        "```" +
        data.answer +
        "```",


      });


    }

  }


});



client.login(
  process.env.DISCORD_TOKEN
);
