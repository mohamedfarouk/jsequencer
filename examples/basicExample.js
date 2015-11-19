(function () {
    $(document).ready(function () {
        function mul100(x) { return x * 100; }
        function add100(x) { return x + 100; }
        function sub50(x) { return x - 50; }
        function div5(x) { return x / 5; }
        function toPause(x, context) {
            context.pause();
            $('#resume').click(function () {
                context.resume(x);
            });
        }

        
		var sequencer = new JSequencer.Sequencer({ resumeOnError: true })
		.add(mul100)
		.add(add100)
		.add(sub50)
		.add(add100)
		.add(mul100)
		.add(div5)
		.add(toPause)
		.add(mul100)
		.onStep(function () { console.log('step executed'); })
		.onPaused(function () { console.log('paused'); })
		.onResumed(function () { console.log('resumed'); })
		.onCompleted(function (x) {
			console.log('finished');
			alert(x);
		})
		.context();

		sequencer.start(1);
	});
})();