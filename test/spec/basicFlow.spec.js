describe("basic flow specs", function () {

    var result = 1;

    function mul100(x) { return x * 100; }
    function add100(x) { return x + 100; }
    function sub50(x) { return x - 50; }
    function div5(x) { return x / 5; }
    function add100WithPause(x, context) {
        context.pause();
        setTimeout(function () {
            context.resume(x + 100);
        }, 5);
    }

    beforeEach(function (done) {
        var sequencer = new JSequencer.Sequencer({ resumeOnError: true })
		.add(mul100)
		.add(add100)
		.add(sub50)
		.add(add100)
		.add(mul100)
		.add(div5)
		.add(add100WithPause)
		.add(mul100)
		.add(div5)
		.add(add100WithPause)
		.add(add100)
		.add(add100WithPause)
		.add(sub50)
		.onStep(function (context) { console.log('step executed'); })
		.onPaused(function (context) { console.log('paused'); })
		.onResumed(function (context) { console.log('resumed'); })
		.onCompleted(function (context, x) {
		    console.log('finished');
		    result = x;
		    console.log(context.getResults());
		    done();
		})
		.context();

        sequencer.start(result);
    });

    it("check final value", function (done) {
        expect(result).toBe(102250);
        done();
    });
});