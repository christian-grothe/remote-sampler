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

SynthDef(\record,{
	|bufnum = 0|
	var sig;
	sig = SoundIn.ar(1);
	RecordBuf.ar(sig, bufnum, doneAction: 2, loop:0);
}).add;

SynthDef(\grainBuf, {
	|rate = 1,speed = 1, bufNum = 0, amp = 0.3, grainDur = 0.1, pos = 0, att= 0.05, rel = 3, modFq = 10, envGate = 0, dens = 20, windowSize = 0.2, spray = 0, lpf = 2500|
	var sig, env, delayBuf, delay;
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
	env = EnvGen.ar(Env.asr(0.01,1,rel),envGate,doneAction: 2);
	sig = LPF.ar(sig,lpf * 2500 + 100);
	sig = sig * env;
	sig = sig;
	sig = sig * amp;
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
	~samplers[data[8]].set(\speed, data[2]);
	~samplers[data[8]].set(\lpf, data[3]);
	~samplers[data[8]].set(\spray, data[4]);
	~samplers[data[8]].set(\windowSize, data[5]);
},'/data');


~free = OSCFunc({
	postln("init");
},'/init')

)

~dl = Synth(\delay);
SynthDef(\delay, {
	|feedback, time|
	var delay, delayBuf, sig;
	delayBuf = Buffer.alloc(s, 44100 * 2, 2);
	sig = In.ar(4,2);
	delay = PingPong.ar(
		bufnum: delayBuf,
		inputs: sig,
		delayTime: time,
		feedback: feedback,
		rotate: 1,
	);
	// sig = sig + delay;
	Out.ar(0,sig);
}).add;

~group = Group.new();
~group.free;
