s.boot;
s.reboot;
s.quit;
s.freeAll;

(
~buffers = [Buffer.alloc(s, s.sampleRate * 10, 1),Buffer.alloc(s, s.sampleRate * 10, 1),Buffer.alloc(s, s.sampleRate * 10, 1)];

~samplers = Order();

~start.free;
~stop.free;
~rec.free;
~data.free;
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
	env = EnvGen.ar(Env.asr(att,1,rel),envGate);
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
~start = OSCFunc({
	|data|
	g = Synth(\grainBuf,[\bufNum,~buffers[data[1]],\envGate, 1]);
	~samplers[data[1]] = g;
},'/start');

~stop = OSCFunc({
	|data|
	~samplers[data[1]].set(\envGate,0);

	postln(~samplers[data[1]]);
},'/stop');

~rec = OSCFunc({
	|data|
	Synth(\record,[\bufnum, ~buffers[data[1]]]);
	postln(data);
},'/rec');

~data = OSCFunc({
	|data|
	~samplers[data[8]].set(\pos, data[1]);
	//~samplers[data[8]].set(\speed, data[2]);
	~samplers[data[8]].set(\rate, (~scale[data[2] * (~scale.size - 1)].midiratio));
	~samplers[data[8]].set(\lpf, data[3]);
	~samplers[data[8]].set(\spray, data[4] * 0.1);
	~samplers[data[8]].set(\windowSize, data[5]);
	~samplers[data[8]].set(\revAmount, data[6]);
	~samplers[data[8]].set(\revRoom, data[7]);
},'/data');
)