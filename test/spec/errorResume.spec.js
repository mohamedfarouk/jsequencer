describe("error resume", function () {

    var result = 1;

    function mul100(context, x) { return x * 100; }
    function add100(context, x) { return x + 100; }
    function sub50(context, x) { return x - 50; }
    function div5(context, x) { return x / 5; }
    function throwError(context, x) { throw "this is error step"; }
    function add100WithPause(context, x) {
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
		.add(throwError)
		.add(mul100)
		.add(div5)
		.add(add100WithPause)
		.add(mul100)
		.add(div5)
		.add(add100WithPause)
		.onStep(function (context) { console.log('step executed'); })
		.onPaused(function (context) { console.log('paused'); })
		.onResumed(function (context) { console.log('resumed'); })
		.onError(function (context, e) {
		    e.newResult = e.lastResult;
		    e.resume = true;
		    console.log('error happend "' + e.error + '" e.resume="' + e.resume + '"');
		})
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
        expect(result).toBe(102100);
        done();
    });
});