/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/** 
 * Developed by: Bruno José
 * version: 3.5
 */

import express from "express";
import axios from "axios";
import { step, step_message } from './flow-steps.js';

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT } = process.env;
const app = express();

var current_step = 1;
var message = {};
var cep = '';

app.use(express.json());


/// POSTS /////////////////////////////////////////////////////// ///

app.post("/webhook", async (req, res) => {
    const message_properties = req.body.entry?.[0]?.changes?.[0].value;

    message = message_properties?.messages?.[0];

    if (hasMessageText() || isClickedButton()) {
        /// REGISTRO DE LOGS /////////////////////////////////////////////////////// ///
        console.log('\n------------------------------------------------------');
        console.log('Mensagem do chat do WhatsApp');
        console.log(message);
        console.log('\ncurrent_step: ' + current_step);

        const business_phone_number_id = message_properties?.metadata?.phone_number_id;
        const payload = await getPayloadToSend();

        /// REGISTRO DE LOGS /////////////////////////////////////////////////////// ///
        console.log('\ncorpo da mensagem/template');
        console.log(payload);
        console.log('------------------------------------------------------');

        await axios({
            method: "POST",
            url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: payload
        });

        await axios({
            method: "POST",
            url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: getReadStatusPayload()
        });
    }

    res.sendStatus(200);
});


/// GETS /////////////////////////////////////////////////////// ///

// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(challenge);
        console.log("Webhook verified successfully!");
    } else {
        res.sendStatus(403);
    }
});

app.get("/", (req, res) => {
    res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});


/// FUNCTIONS /////////////////////////////////////////////////////// ///

async function getAddessByCep() {
    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`)

        if (!empty(response.data.erro)) {
            return undefined;
        }

        return response.data;
    } catch (error) {
        if (error.response.status === 400) {
            return undefined;
        }
    }
}

async function getPayloadToSend() {
    var payload = getMessageThroughStep();

    switch (current_step) {
        case step.WELCOME_MESSAGE:
            current_step = step.CHECK_WELCOME_MESSAGE_BUTTON_CHOICE;
            return payload;

        case step.TYPE_THE_CEP:
        case step.TYPE_AN_CORRECT_CEP:
            current_step = step.CONFIRM_ADDRESS;
            return payload;

        case step.CONFIRM_ADDRESS:
            setCep(message.text.body);
            const address = await getAddessByCep();

            if (empty(address)) {
                current_step = step.TYPE_AN_CORRECT_CEP;
                return getPayloadToSend();
            }

            payload.interactive.body.text = payload.interactive.body.text.replace('{{1}}', address.logradouro);
            payload.interactive.body.text = payload.interactive.body.text.replace('{{2}}', address.bairro);
            payload.interactive.body.text = payload.interactive.body.text.replace('{{3}}', address.localidade);
            payload.interactive.body.text = payload.interactive.body.text.replace('{{4}}', address.uf);
            payload.interactive.body.text = payload.interactive.body.text.replace('{{5}}', address.cep);
            current_step = step.CHECK_CONFIRM_ADDRESS_BUTTON_CHOICE;

            return payload;

        case step.THANKFUL_MESSAGE:
            current_step = step.WELCOME_MESSAGE;
            return payload;
    }
}

/*
  getMessageThroughStep() utiliza os métodos JSON.parse (p/ criar nova instância de objeto json)
  e JSON.stringify (p/ transformar valor em JSON) para criar uma nova referência de memória
  do objeto (array) step_message[current_step] e de suas propriedades.
*/
function getMessageThroughStep() {
    const destiny = {
        "messaging_product": "whatsapp",
        "to": message.from,
    }

    setCurrentStepByButtonChoice();

    const message_base = JSON.parse(
        JSON.stringify(step_message[current_step])
    );

    return { ...destiny, ...message_base };
}

function setCurrentStepByButtonChoice() {
    var answer = '';

    switch (current_step) {
        case step.CHECK_WELCOME_MESSAGE_BUTTON_CHOICE:
            answer = getButtonAnswer();

            if (empty(answer)) {
                current_step = step.WELCOME_MESSAGE;
                break;
            }

            if (answer === "Sim") {
                current_step = step.TYPE_THE_CEP;
            } else {
                current_step = step.THANKFUL_MESSAGE;
            }

            break;

        case step.CHECK_CONFIRM_ADDRESS_BUTTON_CHOICE:
            answer = getButtonAnswer();

            if (empty(answer)) {
                current_step = step.CONFIRM_ADDRESS;
                message.text.body = cep;
                break;
            }

            if (getButtonAnswer() === "Sim") {
                current_step = step.THANKFUL_MESSAGE;
            } else {
                current_step = step.TYPE_THE_CEP;
            }

            break;
    }
}

// @todo criar exception caso não existir um clique de botão
function getButtonAnswer() {
    if (!isClickedButton()) return undefined;

    switch (message?.interactive?.button_reply?.title) {
        case "Sim": return "Sim";
        case "Não": return "Não";
    }
}

function hasMessageText() {
    if (empty(message)) {
        return false;
    }

    return message?.type === "text";
}

function isClickedButton() {
    if (empty(message)) {
        return false;
    }

    return message?.type === "interactive";
}

function getReadStatusPayload() {
    return {
        messaging_product: "whatsapp",
        status: "read",
        message_id: message.id
    }
}

function setCep(new_cep) {
    cep = new_cep;
}

function empty(value) {
    switch (value) {
        case null:
        case undefined:
        case false:
        case {}:
        case "":
        case '':
        case ``:
        case 0:
            return true;
        default:
            return false;
    }
}


/// LISTEN /////////////////////////////////////////////////////// ///

app.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
});
