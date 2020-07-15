'use strict'

/*
1. answer
2. play 'hello-world'
3. waiting caller demf
4. after caller press '#' , asterisk say "your command number is xxxxxxx"
*/

// basic ari-client sample
const ari = require('ari-client');
const asteriskUrl = `http://127.0.0.1:9000`;
const ariAppNameInDialplan = `hello-world`;
const astUser = `someOfAsterisk`;
const pwd = `someOfAsterisk`;
const soundDigits = `sound:digits/`;

// playback
const playback = (channel, sounds) => {
    return new Promise((resolve, reject) => {
        channel.play(
            {media: sounds},
            (err, playback) => {
                if(err){
                    throw err;
                }
                playback.once('PlaybackFinished', (event, instance) => resolve(playback));
            }
        );
    });
}

// make digit number playing a sentence.
const reducer = (accumulator, currentValue) => {
    return accumulator + `${soundDigits}${currentValue},`
};

// when channel started.
const stasisStart = (event, incoming) => {
    console.log('StasisStart event occered.');
    
    let dtmfDigits = [];
    const dtmfRcved = async (event, channel) => {
        const digit = event.digit;
        switch (digit) {
            case '#':
                let sayDigit = dtmfDigits.reduce(reducer,'').slice(0,-1); // remove last comma 
                await playback(channel, `sound:the-number-u-dialed,sound:is,${sayDigit}`);
                dtmfDigits = [];
                break;
            default:
                dtmfDigits.push(digit);
        }
    }
    // set event to incomming call(channel)
    incoming.on('ChannelDtmfReceived', dtmfRcved);

    // answer
    incoming.answer()
    .then( async () => {
        console.log('channel answered..')
        await playback(incoming,'sound:hello-world');
    })
    .catch(err => {});
}

// when channel ended.
const stasisEnd = (event, channel) => {
    console.log('StasisEnd event occered.');
}

// ari client loaded.
const clientLoaded = (err, client) => {
    if(err) {
        throw err;
    }
    // event at channel start.
    client.once('StasisStart', stasisStart);
    // event at channel hangup.
    client.once('StasisEnd', stasisEnd);
    // start Stasis Client
    client.start(ariAppNameInDialplan);
};

// ari client app start
ari.connect(asteriskUrl, astUser, pwd, clientLoaded);
