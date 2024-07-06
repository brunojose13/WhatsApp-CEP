export const step = Object.freeze({
    WELCOME_MESSAGE: 1,
    CHECK_WELCOME_MESSAGE_BUTTON_CHOICE: 2,
    TYPE_THE_CEP: 3,
    TYPE_AN_CORRECT_CEP: -3,
    CONFIRM_ADDRESS: 4,
    CHECK_CONFIRM_ADDRESS_BUTTON_CHOICE: 5,
    THANKFUL_MESSAGE: 6
});

export const step_message = {
    [step.WELCOME_MESSAGE]: {
        "recipient_type": "individual",
        "type": "interactive",
        "interactive": {
            "type": "button",
            "header": { "type": "text", "text": "Serviço" },
            "body": {
                "text": "Olá, seja bem vindo ao canal de comunicação do *PedeAii*. \n\nPara agilizar nosso processo, podemos utilizar sua localização para estimar o tempo de entrega do serviço. \n\nGostaria de fornecer seus dados de endereço?"
            },
            "action": {
                "buttons": [
                    {
                        "type": "reply",
                        "reply": { "id": "1", "title": "Não" }
                    },
                    {
                        "type": "reply",
                        "reply": { "id": "2", "title": "Sim" }
                    }
                ]
            }
        }
    },

    [step.TYPE_THE_CEP]: {
        text: { body: "Por gentileza, informe o seu CEP:" }
    },

    [step.TYPE_AN_CORRECT_CEP]: {
        text: { body: "Parece que o CEP informado não foi encontrado. Por favor, insira um CEP válido:" }
    },

    [step.CONFIRM_ADDRESS]: {
        "recipient_type": "individual",
        "type": "interactive",
        "interactive": {
            "type": "button",
            "header": { "type": "text", "text": "Confirme o seu endereço" },
            "body": {
                "text": "Por gentileza, verifique os dados do CEP informado:\n\n*► Logradouro:* ```{{1}}```\n*► Bairro:* ```{{2}}```\n*► Cidade:* ```{{3}}```\n*► Estado:* ```{{4}}```\n*► CEP:* ```{{5}}```\n\nAs informações correspondente ao seu endereço estão corretas?"
            },
            "action": {
                "buttons": [
                    {
                        "type": "reply",
                        "reply": { "id": "1", "title": "Não" }
                    },
                    {
                        "type": "reply",
                        "reply": { "id": "2", "title": "Sim" }
                    }
                ]
            }
        }
    },

    [step.THANKFUL_MESSAGE]: {
        text: { body: "Obrigado! Vamos para o próximo passo. \n\nComo posso te ajudar? \n_*[fim da operação]*_" }
    }
};
