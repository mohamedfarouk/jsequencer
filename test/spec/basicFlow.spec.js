describe("basic flow specs", function () {

    var result = 1;

    beforeEach(function (done) {
        var sequencer = new JSequencer.Sequencer({ resumeOnError: true })
		.add(function (x) {
		    return x * 100;
		})
        .add(function (x) {
		    return x - 50;
        })
        .add(function (x, context) {
            context.pause();
            setTimeout(function () {
                context.resume(x + 100);
            }, 5);
        })
        .add(function (x) {
            return x / 5;
        })
        .add(function (x) {
            return x + 100;
        })
        .add(function (x, context) {
            context.pause();
            setTimeout(function () {
                context.resume(x + 20);
            }, 5);
        })
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
        expect(result).toBe(150);
        done();
    });
});