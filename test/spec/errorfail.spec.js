describe("error fail", function () {

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
        var sequencer = new JSequencer.Sequencer({ resumeOnError: false })
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
		.onError(function (context, args) {
		    args.resume = false;
		    args.newResult = args.lastResult;
		    console.log('error happend "' + args.error + '" e.resume="' + args.resume + '"');
		})
		.onCompleted(function (context, x) {
		    console.log('finished');
		    result = x;
		    done();
		})
        .onFailed(function (context, args) {
            console.log('failed on step ' + args.stepIndex);
            result = args.lastResult;
            console.log(context.getResults());
            done();
        })
		.context();

        sequencer.start(result);
    });

    it("check final value", function (done) {
        expect(result).toBe(250);
        done();
    });
});