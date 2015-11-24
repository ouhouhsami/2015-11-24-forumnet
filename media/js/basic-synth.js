/* AudioContext */
var audioContext = new window.AudioContext();

/* VCO - Voltage Controlled Oscillator */
var vco = audioContext.createOscillator();
vco.start(0);

/* VCA - Voltage Controlled Amplifier */
var vca = audioContext.createGain();
vca.gain.value = 0;

/* Filter */
var filter = audioContext.createBiquadFilter();

/* Connections */
vco.connect(vca);
vca.connect(filter);
filter.connect(audioContext.destination);

function playNote(freq, time){
    vca.gain.cancelScheduledValues(time);
    vca.gain.setValueAtTime(0, time);
    vca.gain.linearRampToValueAtTime(1, time + attackTime);
    vca.gain.linearRampToValueAtTime(0, time + attackTime + releaseTime);
    vco.frequency.cancelScheduledValues(0);
    vco.frequency.setTargetAtTime(freq, time, 0);
}

/* Control bindings */

var keyboardKeys = document.querySelectorAll(".keyboard");
var attack = document.querySelector(".attack");
var release = document.querySelector(".release");
var vcoType = document.querySelector('.vocType');
var filterFreq = document.querySelector('.filterFreq');
var filterQ = document.querySelector('.filterQ');

var attackTime = 0.025;
var releaseTime = 0.08;

keyboardKeys.forEach(function(keyboardKey) {
    keyboardKey.onclick = function(e) {
        var freq = parseFloat(e.target.dataset.frequency);
        var now = audioContext.currentTime;
        playNote(freq, now);
    };
});

attack.oninput = function(e){
    attackTime = parseFloat(e.target.value);
};

release.oninput = function(e) {
    releaseTime = parseFloat(e.target.value);
};

vcoType.onchange = function(e) {
    vco.type = e.target.value;
};

filterFreq.oninput = function(e){
  var minValue = 40;
  var maxValue = audioContext.sampleRate / 2;
  var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
  // Compute a multiplier from 0 to 1 based on an exponential scale.
  var multiplier = Math.pow(2, numberOfOctaves * (e.target.value - 1.0));
  // Get back to the frequency value between min and max.
  filter.frequency.value = maxValue * multiplier;
  //  filter.frequency.value = parseFloat(e.target.value);
};

filterQ.oninput = function(e){
    filter.Q.value = parseFloat(e.target.value) * 30;
};

/* Midi */

function echoMIDIMessage(event) {
  switch (event.data[0] & 0xf0) {
    case 0x90:
    if (event.data[2] !== 0) {
        var note = event.data[1];
        var freq = 440 * Math.pow(2,(note-69)/12);
        playNote(freq, audioContext.currentTime);
        return;
    }
    case 0x80:
    return;
}
}


function midiSuccessCallback(midiAccess){
    midiAccess.inputs.forEach(function(input){
        console.log(input);
        input.onmidimessage = echoMIDIMessage;
    });

}

function midiFailureCallback(err){
    console.log(err);
}


navigator.requestMIDIAccess().then(midiSuccessCallback,midiFailureCallback);
