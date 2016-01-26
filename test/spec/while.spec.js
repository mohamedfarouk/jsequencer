describe("while loop flow", function () {
    var result = 0;
    beforeEach(function (done) {
        var sequencer = new JSequencer.Sequencer({ resumeOnError: false })
		.add(function (context, x) {
		    result = result + 1
		    console.log("step to be run anyway");
		})
        .while(function (context) {
            context.pause();
            setTimeout(function () {
                console.log("test result to be less than 5, current value = " + result);
                var test = result < 5;
                context.resume(test);
            }, 5);
        })
        .do(function () {
            console.log("incrementing result");
            result = result + 1
        })
        .add(function (context, x) {
            result = result + 1
            console.log("step to be run anyway");
        })
        .onStep(function (context) {  })
		.onPaused(function (context) {  })
		.onResumed(function (context) {  })
		.onCompleted(function (context, x) {
		    console.log('finished');
		    console.log(context.getResults());
		    done();
		})
		.context();

        sequencer.start(result);
    });

    it("check final value", function (done) {
        expect(result).toBe(6);
        done();
    });
});