describe("conditional flow", function () {
    var result = 0;
    beforeEach(function (done) {
        var sequencer = new JSequencer.Sequencer({ resumeOnError: false })
		.add(function (context, x) {
		    result = result + 1
		    console.log("step to be run anyway");
		})
        .if(function (context) {
            context.pause();
            setTimeout(function () {
                console.log("first condition true");
                result = result + 1
                context.resume(true);
            }, 5);
        })
        .then(function () {
            result = result + 1
            console.log("first condition");
        })
        .elseif(function () {
            result = result + 1
            console.log("should not be called at all");
            return true;
        }, function () {
            result = result + 1
            console.log("should not be called at all");
        })
        .else(function () {
            result = result + 1
            console.log("should not be called at all");
        })
        .endif()
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
        expect(result).toBe(4);
        done();
    });
});