s.boot;
s.reboot;
s.quit;
s.freeAll;

(
~sliders.do({
	|slider|
	slider.free;
});

~buffers = [Buffer.alloc(s, s.sampleRate * 10, 1),Buffer.alloc(s, s.sampleRate * 10, 1),Buffer.alloc(s, s.sampleRate * 10, 1)];

~samplers = Order();

~groups = Order();

~start.free;
~stop.free;
~rec.free;
~controller.free;
~spray.free;

~scale = [-24,-19,-12,-9,-7,-5,-2,0,3,5,7,10,12];

SynthDef(\record,{
	|bufnum = 0|
	var sig;
	sig = SoundIn.ar(1);
	RecordBuf.ar(sig, bufnum, doneAction: 2, loop:0);
}).add;

SynthDef(\grainBuf, {
	|rate = 1,speed = 1, bufNum = 0, amp = 0.3, grainDur = 0.1, pos = 0, att= 1, rel = 3, modFq = 10, envGate = 0, dens = 20, windowSize = 0.2, spray = 0, lpf = 2500, revAmount = 0.5, revRoom = 0.5|
	var sig, env, delayBuf, rev;
	sig = GrainBuf.ar(
		numChannels: 2,
		trigger: Impulse.ar(dens),
		dur: grainDur,
		sndbuf: bufNum,
		rate: rate,
		pos: Phasor.ar(
			0,
			speed * 2,
			pos + LFNoise0.ar(100,spray) * BufSamples.ir(bufNum),
			(pos + windowSize) * BufSamples.ir(bufNum)
		) / BufSamples.ir(bufNum),
		pan: WhiteNoise.kr(),
	);
	env = EnvGen.ar(Env.asr(att,1,rel),envGate,doneAction: 2);
	sig = LPF.ar(sig,lpf * 2500 + 100);
	sig = sig * env;
	rev = FreeVerb.ar(
		in: sig * revAmount,
		mix: 1,
		room: revRoom,
		damp: 0.5,
	);
	sig = sig + rev;
	sig = sig * amp;
	DetectSilence.ar(sig, doneAction: 2);
	Out.ar(0, sig);
}).add;

/* OSC Connections */

// start a new grainBuf
~start = OSCFunc({
	|data|
	if(~groups[data[8]] == nil,{
		~groups[data[8]] = Group.new;
	});
	if(~samplers[data[8]] == nil,{
		~samplers[data[8]] = Order();
	});
	~samplers[data[8]][data[9]] = Synth(\grainBuf,[
		\envGate, 1,
		\pos, data[1],
		\rate, (~scale[data[2] * (~scale.size - 1)]).midiratio,
		\lpf, data[3],
		\spray, data[4] * 0.1,
		\windowSize, data[5],
		\revAmount, data[6],
		\revRoom, data[7],
		\bufNum,~buffers[data[8]],
	],~groups[data[8]]);
},'/start');

// stop a grainBuf
~stop = OSCFunc({
	|data|
	~samplers[data[1]][data[2]].set(\envGate,0);
},'/stop');

// record to a buffer
~rec = OSCFunc({
	|data|
	Synth(\record,[\bufnum, ~buffers[data[1]]]);
	postln(data);
},'/rec');

// get controller data
~controller = OSCFunc({
	|data|
	~samplers[data[1]][data[2]].set(\pos, data[3]);
	~samplers[data[1]][data[2]].set(\rate, (~scale[data[4] * (~scale.size - 1)].midiratio));
},'/controller');

// get slider data
~sliders = 5.collect({
	|i|
	var addr;
	addr = "/slider"++i;
	OSCFunc({
		|data|
		if(i == 0, {
			~groups[data[2]].set(\lpf, data[1]);
		});
		if(i == 1, {
			~groups[data[2]].set(\spray, data[1]);
		});
		if(i == 2, {
			~groups[data[2]].set(\windowSize, data[1]);
		});
		if(i == 3, {
			~groups[data[2]].set(\revAmount, data[1]);
		});
		if(i == 4, {
			~groups[data[2]].set(\revRoom, data[1]);
		});
	},addr);
})
)

~test = Order.new;
~test[7] = "hallo3";
~test.removeAt(6);
~test[7];
~test.size;



