require('dotenv-extended').load()

const restify = require('restify');
const builder = require('botbuilder');
const cognitiveservices = require('botbuilder-cognitiveservices');

//configuração do Restify Server

const server = restify.createServer();
server.listen(process.env.port|| process.env.PORT||3978, function(){
    console.log('%s conectando no %s',server.name, server.url);
});

//criando um chat conector para se comunicar com a estrutura de serviço do robo
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
}); 

// Recebe as mensagens do usuario e responde com o prefixo bot shaday
const bot = new builder.UniversalBot(connector);
bot.set('storage', new builder.MemoryBotStorage()); //Registra e armagena na memoria
server.post('/api/messages', connector.listen());

//Conversa do Bot

const recognizer = new cognitiveservices.QnAMakerRecognizer({
   knowledgeBaseId: process.env.QNA_KNOWLEDGE_BASE_ID,
   subscriptionKey: process.env.QNA_SUBSCRIPTION_KEY,
   top: 3
});

const qnaMakerTools = new cognitiveservices.QnAMakerTools();
bot.library(qnaMakerTools.createLibrary());

const basicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'Não encontrei nada no meu Banco de Dados Senhor',
    qnaThreshold: 0.5,
    feedbackLib: qnaMakerTools
});

basicQnAMakerDialog.respondFromQnAMakerResult = (session, qnaMakerResult) => {

    const fistAnswer = qnaMakerResult.answers[0].answer
    const composedAnswer = fistAnswer.split(';')
    if(composedAnswer.length === 1){
        return session.send(fistAnswer)
    }
    const [title, description, url, image] = composedAnswer
    const card = new builder.HeroCard(session)

        .title(title)
        .text(description)
        .images([builder.CardImage.create(session, image.trim())])
        .buttons([builder.CardAction.openUrl(session, url.trim(), 'link do site')])
    const reply = new builder.Message(session).addAttachment(card)
     session.send(reply)
}

bot.dialog('/', basicQnAMakerDialog);