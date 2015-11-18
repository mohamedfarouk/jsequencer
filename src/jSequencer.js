(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['exports'], function(exports) {
			// Export global even in AMD case in case this script is loaded with
			// others that may still expect a global Backbone.
			root.JSequencer = factory(root, exports);
		});
	} 
	else if (typeof exports !== 'undefined') {
		// Next for Node.js or CommonJS. jQuery may not be needed as a module.
		factory(root, exports);
	} 
	else {
		// Finally, as a browser global.
		root.JSequencer = factory(root, {});
	}

}(this, function(root, JSequencer){

	// Save the previous value of the `Backbone` variable, so that it can be
	// restored later on, if `noConflict` is used.
	var previousJSequencer = root.JSequencer;
	
	// Current version of the library. Keep in sync with `package.json`.
	JSequencer.VERSION = '1.0.0';
	
	// Runs JSequencer.js in *noConflict* mode, returning the `JSequencer` variable
	// to its previous owner. Returns a reference to this JSequencer object.
	JSequencer.noConflict = function() {
		root.JSequencer = previousJSequencer;
		return this;
	};

	//constant states
	var STAT_NOT_STARTED = JSequencer.STAT_NOT_STARTED = "NOT_STARTED";
	var STAT_EXECUTING = JSequencer.STAT_EXECUTING = "EXECUTING";
	var STAT_STEP_EXECUTED = JSequencer.STAT_STEP_EXECUTED = "STEP_EXECUTED";
	var STAT_ERROR = JSequencer.STAT_ERROR = "ERROR";
	var STAT_PAUSED = JSequencer.STAT_PAUSED = "PAUSED";
	var STAT_RESUMED = JSequencer.STAT_RESUMED = "RESUMED";
	var STAT_COMPLETED = JSequencer.STAT_COMPLETED = "COMPLETED";
	var STAT_FAILED = JSequencer.STAT_FAILED = "FAILED";
	
	function ExecutionContext(funcTable, resumeOnError, stateChangeCallback) {
            var state = STAT_NOT_STARTED;
            var currentStepIndex;
            var results = [];

            function runSingleStep(stepIndex, lastResult) {

                //each call back is added as object like 
                /*
                 {
                    func: function to call,
                    context: function this object,
                    params: function params (could be array or another func and will use the same context)
                 }
                 // each func will be passed execution context
                 */
                var context = funcTable[stepIndex].context;
                var func = funcTable[stepIndex].func;
                var params = funcTable[stepIndex].params;
                if (typeof params === "function") {
                    params = params.call(context);
                }
                if (params instanceof Array) {
                    params.push(lastResult);// add last result
                    params.push(this);//add context to params
                }
                else {
                    params = [params, lastResult, this];
                }
                setState.call(this, STAT_EXECUTING);
                var result = func.apply(context, params);
                return result;
            }

            function runSequence(resumeIndex, lastResult) {
                currentStepIndex = resumeIndex;
                var returnVal;
                try{
                    returnVal = runSingleStep.call(this, currentStepIndex, lastResult);
                }
                catch (ex) {
                    results[currentStepIndex] = undefined;
                    var errorArgs = { resume: resumeOnError, error: ex };
                    if (typeof errorCallback === "function")
                        errorCallback.call(errorContext, errorArgs, this);
                    if (!errorArgs.resume) {
                        setState.call(this, STAT_FAILED);
                        return;
                    }
                    else {
                        currentStepIndex++;
                        runSequence.call(this, currentStepIndex, errorArgs);
                    }
                }

                if (state !== STAT_PAUSED) {
                    results[currentStepIndex] = returnVal;
                    stateChangeCallback.call(this, STAT_STEP_EXECUTED, returnVal);

                    if (currentStepIndex >= funcTable.length - 1) {
                        setState.call(this, STAT_COMPLETED, returnVal);
                        return;
                    }
                    else {
                        currentStepIndex++;
                        runSequence.call(this, currentStepIndex, returnVal);
                    }
                }
            }

            function setState(newState) {
                state = newState;
                stateChangeCallback.apply(this, arguments);
            }

           
            this.start = function (inArguments) {
                currentStepIndex = 0;
                runSequence.call(this, currentStepIndex, inArguments);
            }

            this.pause = function () {
                if (state != STAT_EXECUTING)
                    throw "cannot call pause unless state is " + STAT_EXECUTING + " current state is " + state;
                setState.call(this, STAT_PAUSED);
            }

            this.resume = function (lastResult) {
                if (state != STAT_PAUSED)
                    throw "cannot call resume unless state is " + STAT_PAUSED + " current state is " + state;

                setState.call(this, STAT_RESUMED);
                results[currentStepIndex] = lastResult;
                stateChangeCallback.call(this, STAT_STEP_EXECUTED, lastResult);

                currentStepIndex++;
                runSequence.call(this, currentStepIndex, lastResult);
            }

            this.break = function (lastResult) {
                if (state != STAT_EXECUTING && state != STAT_PAUSED)
                    throw "cannot call pause unless state is " + STAT_EXECUTING + " or " + STAT_PAUSED + " current state is " + state;
                currentStepIndex = funcTable.length;
                setState.call(this, STAT_COMPLETED, lastResult);
                return;
            };

            this.getResults = function () {
                // create copy of results array
                var newResults = [];
                for (var i in results)
                    newResults.push(results[i]);
                return newResults;
            }
        }

	JSequencer.Sequencer = function(options) {
		var funcTable = [];

		var stepCallback, stepContext;
		var completedCallback, completedContext;
		var errorCallback, errorContext;
		var failedCallback, failedContext;
		var pausedCallback, pausedContext;
		var resumedCallback, resumedContext;

		if (options.defaultContext === undefined || options.defaultContext === null)
			options.defaultContext = this;
		if (options.resumeOnError === undefined || options.resumeOnError === null)
			options.resumeOnError = false;

		var executionContext = null;

		function stateChanged(state) {
			// this function executed with this = ExecutionContext object
			if (state === STAT_COMPLETED) {
				if (typeof completedCallback === "function")
					completedCallback.call(completedContext, arguments[1], this, this.getResults());
			}
			else if (state === STAT_STEP_EXECUTED) {
				if (typeof stepCallback === "function")
					stepCallback.call(stepContext, this);
			}
			else if (state === STAT_PAUSED) {
				if (typeof pausedCallback === "function")
					pausedCallback.call(pausedContext, this);
			}
			else if (state === STAT_FAILED) {
				if (typeof failedCallback === "function")
					failedCallback.call(failedContext, this, arguments[1]);
			}
			else if (state === STAT_ERROR) {
				var errorArgs = { resume: options.resumeOnError, error: arguments[1] };
				if (typeof errorCallback === "function") {
					errorCallback.call(errorContext, this, errorArgs);
				}
				if (errorArgs.resume)
					this.resume();
				else
					stateChanged(STAT_FAILED, arguments[1]);
			}
			else if (state === STAT_RESUMED) {
				if (typeof resumedCallback === "function") {
					resumedCallback.call(resumedContext, this);
				}
			}
		}

		executionContext = new ExecutionContext(funcTable, options.resumeOnError, stateChanged);


		//each call back is added as object like 
		/*
		 {
			func: function to call,
			context: function this object,
			params: function params (could be array or another func and will use the same context)
		 }
		 // each func will be passed execution context
		 */
		this.add = function (func, context, params) {
			if (typeof func === "object" && arguments.length > 1)
				throw "parameters can be either passed as single object or arguments, not both";

			if (typeof func === "object") {
				context = func.context;
				params = func.params;
				func = func.func;
			}
			if (context === null || context === undefined)
				context = options.defaultContext;
			if (params === null || params === undefined)
				params = [];

			funcTable.push({
				context: context,
				params: params,
				func: func
			});

			return this;
		};

		this.onStep = function (callback, context) {
			stepCallback = callback;
			stepContext = (context === undefined || context === null) ? options.defaultContext : context;
			return this;
		}

		this.onCompleted = function (callback, context) {
			completedCallback = callback;
			completedContext = (context === undefined || context === null) ? options.defaultContext : context;;
			return this;
		}

		this.onError = function (callback, context) {
			errorCallback = callback;
			errorContext = (context === undefined || context === null) ? options.defaultContext : context;;
			return this;
		}

		this.onFailed = function (callback, context) {
			failedCallback = callback;
			failedContext = (context === undefined || context === null) ? options.defaultContext : context;;
			return this;
		}

		this.onPaused = function (callback, context) {
			pausedCallback = callback;
			pausedContext = (context === undefined || context === null) ? options.defaultContext : context;;
			return this;
		}

		this.onResumed = function (callback, context) {
			resumedCallback = callback;
			resumedContext = (context === undefined || context === null) ? options.defaultContext : context;;
			return this;
		}

		this.context = function () {
			return executionContext;
		};
	}

	return JSequencer;
}));